#!/usr/bin/env bash
set -euo pipefail

LAN_HOSTNAME="${1:-plan-self.home.arpa}"
LAN_IP_ADDRESS="${2:-}"
HTTP_PORT="${3:-8080}"
HTTPS_PORT="${4:-8443}"

BUNDLE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BUNDLE_ROOT"

if command -v docker >/dev/null 2>&1; then
  CONTAINER_ENGINE=docker
  COMPOSE=(docker compose)
elif command -v podman >/dev/null 2>&1; then
  CONTAINER_ENGINE=podman
  if command -v podman-compose >/dev/null 2>&1; then COMPOSE=(podman-compose); else COMPOSE=(podman compose); fi
else
  echo "Docker or Podman is required." >&2
  exit 1
fi

for required in images.tar docker-compose.yml .env.example; do
  if [[ ! -f "$required" ]]; then
    echo "Bundle is incomplete: $required is missing." >&2
    exit 1
  fi
done

"$CONTAINER_ENGINE" image load --input images.tar

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

set_env() {
  local key="$1"
  local value="$2"
  if grep -q "^$key=" .env; then
    sed -i.bak "s|^$key=.*|$key=$value|" .env
    rm -f .env.bak
  else
    printf '%s=%s\n' "$key" "$value" >>.env
  fi
}

if [[ "$HTTPS_PORT" == "443" ]]; then
  EXTERNAL_URL="https://$LAN_HOSTNAME"
else
  EXTERNAL_URL="https://$LAN_HOSTNAME:$HTTPS_PORT"
fi

set_env DATABASE_URL "postgresql://plan-self:plan-self@postgres:5432/plan_self"
set_env REDIS_URL "redis://redis:6379"
set_env API_BASE_URL "http://api:3001"
set_env GATEWAY_URL "http://gateway:3010"
set_env APP_BASE_URL "$EXTERNAL_URL"
set_env PLAN_SELF_HTTP_PORT "$HTTP_PORT"
set_env PLAN_SELF_HTTPS_PORT "$HTTPS_PORT"
set_env JWT_ACCESS_SECRET "$(openssl rand -hex 48)"
set_env JWT_REFRESH_SECRET "$(openssl rand -hex 48)"
set_env GATEWAY_SECRET "$(openssl rand -hex 48)"
set_env AIR_GAPPED "true"

if [[ ! -f infrastructure/pki/server.crt || ! -f infrastructure/pki/server.key ]]; then
  ./scripts/generate-lan-cert.sh "$LAN_HOSTNAME" "$LAN_IP_ADDRESS"
fi

"${COMPOSE[@]}" -f docker-compose.yml up -d --no-build

echo "Plan Self started at $EXTERNAL_URL"
echo "Trust infrastructure/pki/root-ca.crt on each client device."
