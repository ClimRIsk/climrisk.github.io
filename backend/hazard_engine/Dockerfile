FROM python:3.12-slim

WORKDIR /app

# GDAL + rasterio native deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    libgdal-dev gdal-bin \
    libgeos-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ../shared /app/shared
COPY . /app/hazard_engine

ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV GDAL_DATA=/usr/share/gdal

EXPOSE 8002
CMD ["uvicorn", "hazard_engine.main:app", "--host", "0.0.0.0", "--port", "8002", "--workers", "2"]
