#!/usr/bin/env bash
set -euo pipefail

cp .env.example .env
npm install
npm run db:generate

echo "Setup concluído. Ajuste .env e execute: docker compose up -d --build"
