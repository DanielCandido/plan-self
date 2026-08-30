param(
  [string]$Hostname = "plan-self.home.arpa",
  [string]$IpAddress = "",
  [int]$HttpPort = 8080,
  [int]$HttpsPort = 8443
)

$ErrorActionPreference = "Stop"
$bundleRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $bundleRoot

$containerEngine = if (Get-Command docker -ErrorAction SilentlyContinue) { "docker" } elseif (Get-Command podman -ErrorAction SilentlyContinue) { "podman" } else { throw "Docker or Podman is required." }
$composeCommand = if ($containerEngine -eq "docker") { @("docker", "compose") } elseif (Get-Command podman-compose -ErrorAction SilentlyContinue) { @("podman-compose") } else { @("podman", "compose") }

foreach ($required in @("images.tar", "docker-compose.yml", ".env.example")) {
  if (-not (Test-Path -LiteralPath $required)) {
    throw "Bundle is incomplete: $required is missing."
  }
}

& $containerEngine image load --input images.tar
if ($LASTEXITCODE -ne 0) {
  throw "Could not load offline images."
}

if (-not (Test-Path -LiteralPath ".env")) {
  Copy-Item -LiteralPath ".env.example" -Destination ".env"
}

$lines = [System.Collections.Generic.List[string]](Get-Content -LiteralPath ".env")
function New-UrlSafeSecret {
  $bytes = New-Object byte[] 48
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
}
function Set-EnvValue([string]$key, [string]$value) {
  for ($index = 0; $index -lt $lines.Count; $index++) {
    if ($lines[$index] -match ("^" + [regex]::Escape($key) + "=")) {
      $lines[$index] = "$key=$value"
      return
    }
  }
  $lines.Add("$key=$value")
}

$externalUrl = if ($HttpsPort -eq 443) { "https://$Hostname" } else { "https://{0}:{1}" -f $Hostname, $HttpsPort }
Set-EnvValue "DATABASE_URL" "postgresql://plan-self:plan-self@postgres:5432/plan_self"
Set-EnvValue "REDIS_URL" "redis://redis:6379"
Set-EnvValue "API_BASE_URL" "http://api:3001"
Set-EnvValue "GATEWAY_URL" "http://gateway:3010"
Set-EnvValue "APP_BASE_URL" $externalUrl
Set-EnvValue "PLAN_SELF_HTTP_PORT" "$HttpPort"
Set-EnvValue "PLAN_SELF_HTTPS_PORT" "$HttpsPort"
Set-EnvValue "JWT_ACCESS_SECRET" (New-UrlSafeSecret)
Set-EnvValue "JWT_REFRESH_SECRET" (New-UrlSafeSecret)
Set-EnvValue "GATEWAY_SECRET" (New-UrlSafeSecret)
Set-EnvValue "AIR_GAPPED" "true"
[System.IO.File]::WriteAllLines((Join-Path $bundleRoot ".env"), $lines, [System.Text.UTF8Encoding]::new($false))

if (
  -not (Test-Path -LiteralPath "infrastructure/pki/server.crt") -or
  -not (Test-Path -LiteralPath "infrastructure/pki/server.key")
) {
  & "$PSScriptRoot/generate-lan-cert.ps1" -Hostname $Hostname -IpAddress $IpAddress
}

if ($composeCommand.Count -eq 1) {
  & $composeCommand[0] -f docker-compose.yml up -d --no-build
} else {
  & $composeCommand[0] $composeCommand[1] -f docker-compose.yml up -d --no-build
}
if ($LASTEXITCODE -ne 0) {
  throw "Could not start Plan Self."
}

Write-Host "Plan Self started at $externalUrl"
Write-Host "Trust infrastructure/pki/root-ca.crt on each client device."
