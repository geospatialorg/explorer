#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env.production"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found. Copy .env.production.example and fill in real values."
  exit 1
fi

echo "==> Pulling latest changes..."
git pull

echo "==> Building Docker image..."
docker build -t geospatialorg-explorer \
  --build-arg NEXT_PUBLIC_BASE_PATH="/explorer" \
  --build-arg NEXT_PUBLIC_SITE_TITLE="geo-spatial.org Explorer" \
  --build-arg NEXT_PUBLIC_SITE_URL="https://services.geo-spatial.org/explorer" \
  --build-arg NEXT_PUBLIC_TITILER_URL="https://services.geo-spatial.org/titiler" \
  --build-arg NEXT_PUBLIC_GEOSERVER_URL="https://services.geo-spatial.org/geoserver" \
  .

echo "==> Restarting container..."
docker rm -f geospatialorg-explorer 2>/dev/null || true

docker run -d --name geospatialorg-explorer \
  --add-host=host.docker.internal:host-gateway \
  --env-file "$ENV_FILE" \
  -p 3001:3000 \
  geospatialorg-explorer

echo "==> Done! Container is running."
docker logs --tail 5 geospatialorg-explorer
