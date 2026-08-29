#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

LAN_HOSTNAME="${LAN_HOSTNAME:-plan-self.home.arpa}"
LAN_IP_ADDRESS="${LAN_IP_ADDRESS:-}"
if [[ ! -f infrastructure/pki/server.crt || ! -f infrastructure/pki/server.key ]]; then
  ./scripts/generate-lan-cert.sh "$LAN_HOSTNAME" "$LAN_IP_ADDRESS"
fi
npm install
npm run db:generate

echo "Setup complete. Trust infrastructure/pki/root-ca.crt on client devices."
echo "Adjust .env and run: docker compose up -d --build"
