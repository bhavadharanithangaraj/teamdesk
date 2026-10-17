#!/usr/bin/env bash
# Runs every SQL Server script in order inside the Docker container.
# Usage (from the project root, after `docker compose up -d`):  ./scripts/init-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env; set +a

for script in 01_schema.sql 02_seed.sql 03_procedures.sql 04_reports.sql 05_app_user.sql; do
  echo "==> $script"
  docker exec teamdesk-sqlserver /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa \
    -P "$MSSQL_SA_PASSWORD" -b -I -i "/sql/$script" -v APP_PASSWORD="$APP_DB_PASSWORD"
done
echo "Database ready."
