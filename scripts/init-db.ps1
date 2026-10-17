# Runs every SQL Server script in order inside the Docker container.
# Usage (from the project root, after `docker compose up -d`):  .\scripts\init-db.ps1
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

$envVars = @{}
Get-Content .env | Where-Object { $_ -match '^\s*([A-Z_]+)\s*=\s*(.*)$' } | ForEach-Object { $envVars[$Matches[1]] = $Matches[2].Trim() }

$scripts = "01_schema.sql", "02_seed.sql", "03_procedures.sql", "04_reports.sql", "05_app_user.sql"
foreach ($script in $scripts) {
    Write-Host "==> $script" -ForegroundColor Cyan
    docker exec teamdesk-sqlserver /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa `
        -P $envVars["MSSQL_SA_PASSWORD"] -b -I -i "/sql/$script" -v APP_PASSWORD=$($envVars["APP_DB_PASSWORD"])
    if ($LASTEXITCODE -ne 0) { throw "$script failed" }
}
Write-Host "Database ready." -ForegroundColor Green
