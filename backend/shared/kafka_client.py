"""
ClimRisk — Shared Kafka Producer / Consumer

Wraps aiokafka with:
  • JSON serialisation / deserialisation via Pydantic models
  • Exactly-once semantics for transactional producers (parametric engine)
  • Dead-letter queue (DLQ) routing on deserialization failures
  • Structured logging with event_id correlation
"""

from __future__ import annotations

import json
import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Callable, Type

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from aiokafka.errors import KafkaError
from pydantic import BaseModel

from .schemas import TOPICS

logger = logging.getLogger("climrisk.kafka")

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "kafka:29092")
DLQ_TOPIC = TOPICS["dlq"]


# ── Producer ──────────────────────────────────────────────────────────────────

class ClimRiskProducer:
    """
    Async Kafka producer wrapping aiokafka.
    Use as an async context manager or call start()/stop() explicitly.

    Usage:
        async with ClimRiskProducer() as p:
            await p.send(TOPICS["asset_validated"], event)
    """

    def __init__(
        self,
        transactional: bool = False,
        transactional_id: str | None = None,
    ) -> None:
        self._transactional = transactional
        kwargs: dict = {
            "bootstrap_servers": KAFKA_BOOTSTRAP,
            "value_serializer": lambda v: json.dumps(v).encode(),
            "key_serializer": lambda k: k.encode() if k else None,
            "acks": "all",
            "enable_idempotence": True,
            "compression_type": "gzip",
        }
        if transactional:
            kwargs["transactional_id"] = transactional_id or "climrisk-txn-producer"
        self._producer = AIOKafkaProducer(**kwargs)

    async def start(self) -> None:
        await self._producer.start()
        if self._transactional:
            await self._producer.begin_transaction()

    async def stop(self) -> None:
        try:
            if self._transactional:
                await self._producer.commit_transaction()
        finally:
            await self._producer.stop()

    async def send(
        self,
        topic: str,
        event: BaseModel,
        key: str | None = None,
    ) -> None:
        """Serialise and send a Pydantic event model to a Kafka topic."""
        payload = json.loads(event.model_dump_json())
        await self._producer.send(topic, value=payload, key=key)
        logger.info(
            "kafka.sent topic=%s event_id=%s",
            topic,
            getattr(event, "event_id", "?"),
        )

    async def abort(self) -> None:
        if self._transactional:
            await self._producer.abort_transaction()

    async def __aenter__(self) -> ClimRiskProducer:
        await self.start()
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        if exc_type and self._transactional:
            await self.abort()
        await self.stop()


# ── Consumer ─────────────────────────────────────────────────────────────────

class ClimRiskConsumer:
    """
    Async Kafka consumer wrapping aiokafka.
    Routes malformed messages to the DLQ rather than crashing.

    Usage:
        consumer = ClimRiskConsumer(
            topics=[TOPICS["asset_validated"]],
            group_id="hazard-engine-group",
            schema=AssetValidatedEvent,
            handler=my_handler_fn,
        )
        await consumer.run()   # blocks; call consumer.stop() to exit
    """

    def __init__(
        self,
        topics: list[str],
        group_id: str,
        schema: Type[BaseModel],
        handler: Callable,
        auto_offset_reset: str = "earliest",
        enable_auto_commit: bool = True,
    ) -> None:
        self._topics = topics
        self._group_id = group_id
        self._schema = schema
        self._handler = handler
        self._running = False
        self._consumer = AIOKafkaConsumer(
            *topics,
            bootstrap_servers=KAFKA_BOOTSTRAP,
            group_id=group_id,
            auto_offset_reset=auto_offset_reset,
            enable_auto_commit=enable_auto_commit,
            value_deserializer=lambda v: json.loads(v.decode()),
        )
        # DLQ producer (non-transactional)
        self._dlq_producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP,
            value_serializer=lambda v: json.dumps(v).encode(),
        )

    async def start(self) -> None:
        await self._consumer.start()
        await self._dlq_producer.start()
        self._running = True
        logger.info("kafka.consumer.started topics=%s group=%s", self._topics, self._group_id)

    async def stop(self) -> None:
        self._running = False
        await self._consumer.stop()
        await self._dlq_producer.stop()

    async def run(self) -> None:
        await self.start()
        try:
            async for msg in self._consumer:
                await self._process(msg)
        finally:
            await self.stop()

    async def _process(self, msg) -> None:
        try:
            raw = msg.value
            event = self._schema.model_validate(raw)
            await self._handler(event)
        except Exception as exc:
            logger.error(
                "kafka.consumer.error topic=%s offset=%d error=%s",
                msg.topic, msg.offset, exc,
            )
            await self._dlq(msg, str(exc))

    async def _dlq(self, msg, error: str) -> None:
        """Route failed messages to dead-letter queue with error annotation."""
        try:
            dlq_payload = {
                "original_topic": msg.topic,
                "original_offset": msg.offset,
                "error": error,
                "raw_value": msg.value,
            }
            await self._dlq_producer.send(DLQ_TOPIC, value=dlq_payload)
        except KafkaError as e:
            logger.critical("kafka.dlq.failed %s", e)
