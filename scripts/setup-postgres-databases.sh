#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${1:-cricket_pg}"

echo "Creating dev/prd databases in container: ${CONTAINER_NAME}"
docker exec -i "${CONTAINER_NAME}" psql -U cricket -d postgres <<'SQL'
CREATE DATABASE cricket_top10_dev;
CREATE DATABASE cricket_top10_prd;
SQL

echo "Done. Databases created:"
docker exec -i "${CONTAINER_NAME}" psql -U cricket -d postgres -c "\l"
