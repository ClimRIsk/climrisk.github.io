FROM python:3.12-slim

WORKDIR /app

# System deps for asyncpg (libpq) and pandas/openpyxl
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy shared schemas + this service
COPY ../shared /app/shared
COPY . /app/asset_service

ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8001
CMD ["uvicorn", "asset_service.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
