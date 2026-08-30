#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-$(node -p "require('./package.json').version")}"
OUTPUT_DIRECTORY="${2:-release}"
SKIP_BUILD="${SKIP_BUILD:-false}"
if command -v docker >/dev/null 2>&1; then CONTAINER_ENGINE=docker; elif command -v podman >/dev/null 2>&1; then CONTAINER_ENGINE=podman; else echo "Docker or Podman is required." >&2; exit 1; fi

if [[ "$SKIP_BUILD" != "true" ]]; then
  if [[ "$CONTAINER_ENGINE" == docker ]]; then
    docker compose build
  else
    podman build -t plan-self-api:latest -f infrastructure/docker/api.Dockerfile .
    podman build -t plan-self-web:latest -f infrastructure/docker/web.Dockerfile .
    podman build -t plan-self-worker:latest -f infrastructure/docker/worker.Dockerfile .
    podman build -t plan-self-gateway:latest -f infrastructure/docker/gateway.Dockerfile .
    podman build -t plan-self-setup-wizard:latest -f infrastructure/docker/setup-wizard.Dockerfile .
  fi
fi

IMAGES=(
  "plan-self-api:latest"
  "plan-self-web:latest"
  "plan-self-worker:latest"
  "plan-self-gateway:latest"
  "plan-self-setup-wizard:latest"
  "postgres:16-alpine"
  "redis:7-alpine"
  "nginx:1.27-alpine"
)

for image in "${IMAGES[@]}"; do
  "$CONTAINER_ENGINE" image inspect "$image" >/dev/null
done

mkdir -p "$OUTPUT_DIRECTORY"
OUTPUT_DIRECTORY="$(cd "$OUTPUT_DIRECTORY" && pwd)"
ARCHIVE_PATH="$OUTPUT_DIRECTORY/plan-self-offline-$VERSION.tar"
CHECKSUM_PATH="$ARCHIVE_PATH.sha256"
if [[ -e "$ARCHIVE_PATH" || -e "$CHECKSUM_PATH" ]]; then
  echo "Release already exists: $ARCHIVE_PATH" >&2
  exit 1
fi

STAGING="$(mktemp -d)"
trap 'rm -rf "$STAGING"' EXIT
mkdir -p "$STAGING/scripts" "$STAGING/infrastructure/nginx" "$STAGING/infrastructure/pki" "$STAGING/docs"

cp docker-compose.offline.yml "$STAGING/docker-compose.yml"
cp .env.example "$STAGING/.env.example"
cp infrastructure/nginx/nginx.conf "$STAGING/infrastructure/nginx/nginx.conf"
cp scripts/install-offline.ps1 scripts/generate-lan-cert.ps1 "$STAGING/scripts/"
cp scripts/install-offline.sh scripts/generate-lan-cert.sh "$STAGING/scripts/"
cp docs/lan-setup.md "$STAGING/docs/lan-setup.md"
cp docs/offline-bundle.md "$STAGING/docs/offline-bundle.md"

"$CONTAINER_ENGINE" image save --output "$STAGING/images.tar" "${IMAGES[@]}"
IMAGES_HASH="$(sha256sum "$STAGING/images.tar" | awk '{print $1}')"
cat >"$STAGING/manifest.json" <<EOF
{
  "product": "plan-self",
  "version": "$VERSION",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "imagesSha256": "$IMAGES_HASH"
}
EOF

tar -cf "$ARCHIVE_PATH" -C "$STAGING" .
sha256sum "$ARCHIVE_PATH" | sed "s|$ARCHIVE_PATH|$(basename "$ARCHIVE_PATH")|" >"$CHECKSUM_PATH"

echo "Offline bundle created: $ARCHIVE_PATH"
echo "Checksum: $CHECKSUM_PATH"
