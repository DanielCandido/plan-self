#!/usr/bin/env bash
set -euo pipefail

npm run build

docker compose up -d --build
