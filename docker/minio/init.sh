#!/bin/sh

# Wait for MinIO to be ready (optional buffer after healthcheck)
sleep 5

echo "Setting up MinIO aliases..."
# Set up aliases for both local and myminio (for compatibility)
mc alias set local http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
mc alias set myminio http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"

echo "Creating bucket: $MINIO_BUCKET"
# Make bucket (ignore error if it already exists)
mc mb local/"$MINIO_BUCKET" || true

echo "Setting bucket policies..."
# Set bucket policy to allow read/write access
mc policy set download local/"$MINIO_BUCKET"
mc policy set upload local/"$MINIO_BUCKET"

echo "Verifying bucket creation and policies..."
# List all buckets and their policies for confirmation
mc ls local
mc policy list local/"$MINIO_BUCKET"

echo "MinIO initialization complete."
