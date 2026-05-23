#!/usr/bin/env bash
set -euo pipefail

cp .env.example .env
npm install
npm run db:generate

echo "Setup complete. Adjust .env and run: docker compose up -d --build"
