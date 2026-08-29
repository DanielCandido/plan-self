param(
  [string]$Hostname = "plan-self.home.arpa",
  [string]$IpAddress = ""
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

if (-not (Test-Path -LiteralPath ".env")) {
  Copy-Item -LiteralPath ".env.example" -Destination ".env"
}

if (
  -not (Test-Path -LiteralPath "infrastructure/pki/server.crt") -or
  -not (Test-Path -LiteralPath "infrastructure/pki/server.key")
) {
  & "$PSScriptRoot/generate-lan-cert.ps1" -Hostname $Hostname -IpAddress $IpAddress
}

npm install
if ($LASTEXITCODE -ne 0) {
  throw "npm install failed"
}

npm run db:generate
if ($LASTEXITCODE -ne 0) {
  throw "database client generation failed"
}

Write-Host "Setup complete."
Write-Host "Trust infrastructure/pki/root-ca.crt on every client device."
Write-Host "Map $Hostname to this server in the LAN DNS, then run docker compose up -d --build."

