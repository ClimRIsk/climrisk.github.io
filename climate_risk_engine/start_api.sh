#!/bin/bash
cd "$(dirname "$0")"
PYTHONPATH=src uvicorn cri.api.main:app --reload --port 8000
