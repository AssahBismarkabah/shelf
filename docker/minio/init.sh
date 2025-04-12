#!/bin/sh

# Wait for MinIO to be ready (optional buffer after healthcheck)
sleep 5

# Set up alias
mc alias set myminio http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"

# Make bucket (ignore error if it already exists)
mc mb myminio/"$MINIO_BUCKET" || true

# List all buckets for confirmation
mc ls myminio
