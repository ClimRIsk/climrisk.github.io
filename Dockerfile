# ─────────────────────────────────────────────────────────────────────────────
# ClimRisk — AWS Fargate Container
# Base: condaforge/miniforge3 (ships GDAL/PROJ/GEOS via conda)
# ─────────────────────────────────────────────────────────────────────────────
FROM condaforge/miniforge3:latest

WORKDIR /app

# Install geospatial stack via conda-forge for correct C-lib linking
RUN mamba install -y -c conda-forge \
        xarray=2024.* \
        dask=2024.* \
        rioxarray \
        pandas \
        numpy \
        scipy \
        requests \
        s3fs \
        zarr \
        boto3 \
        pystac-client \
        planetary-computer \
        gdal \
    && conda clean -afy

# Copy pipeline
COPY pipeline.py /app/pipeline.py

# Optional: asset CSV for batch runs
COPY assets.csv /app/assets.csv 2>/dev/null || true

ENTRYPOINT ["python", "/app/pipeline.py"]
