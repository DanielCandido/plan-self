param(
  [string]$Version = "",
  [string]$OutputDirectory = "release",
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

$containerEngine = if (Get-Command docker -ErrorAction SilentlyContinue) { "docker" } elseif (Get-Command podman -ErrorAction SilentlyContinue) { "podman" } else { throw "Docker or Podman is required." }

if (-not $Version) {
  $package = Get-Content -LiteralPath "package.json" -Raw | ConvertFrom-Json
  $Version = $package.version
}

if (-not $SkipBuild) {
  if ($containerEngine -eq "docker") {
    docker compose build
  } else {
    $builds = [ordered]@{
      "plan-self-api:latest" = "infrastructure/docker/api.Dockerfile"
      "plan-self-web:latest" = "infrastructure/docker/web.Dockerfile"
      "plan-self-worker:latest" = "infrastructure/docker/worker.Dockerfile"
      "plan-self-gateway:latest" = "infrastructure/docker/gateway.Dockerfile"
      "plan-self-setup-wizard:latest" = "infrastructure/docker/setup-wizard.Dockerfile"
    }
    foreach ($entry in $builds.GetEnumerator()) {
      podman build -t $entry.Key -f $entry.Value .
      if ($LASTEXITCODE -ne 0) { throw "Image build failed: $($entry.Key)" }
    }
  }
  if ($LASTEXITCODE -ne 0) { throw "Container image build failed." }
}

$images = @(
  "plan-self-api:latest",
  "plan-self-web:latest",
  "plan-self-worker:latest",
  "plan-self-gateway:latest",
  "plan-self-setup-wizard:latest",
  "postgres:16-alpine",
  "redis:7-alpine",
  "nginx:1.27-alpine"
)

foreach ($image in $images) {
  & $containerEngine image inspect $image | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Required image is missing: $image"
  }
}

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$outputRoot = (Resolve-Path -LiteralPath $OutputDirectory).Path
$archivePath = Join-Path $outputRoot "plan-self-offline-$Version.tar"
$checksumPath = "$archivePath.sha256"
if ((Test-Path -LiteralPath $archivePath) -or (Test-Path -LiteralPath $checksumPath)) {
  throw "Release already exists: $archivePath"
}

$staging = Join-Path ([System.IO.Path]::GetTempPath()) ("plan-self-bundle-" + [guid]::NewGuid().ToString("N"))
try {
  New-Item -ItemType Directory -Path $staging -Force | Out-Null
  New-Item -ItemType Directory -Path (Join-Path $staging "scripts") -Force | Out-Null
  New-Item -ItemType Directory -Path (Join-Path $staging "infrastructure/nginx") -Force | Out-Null
  New-Item -ItemType Directory -Path (Join-Path $staging "infrastructure/pki") -Force | Out-Null
  New-Item -ItemType Directory -Path (Join-Path $staging "docs") -Force | Out-Null

  Copy-Item -LiteralPath "docker-compose.offline.yml" -Destination (Join-Path $staging "docker-compose.yml")
  Copy-Item -LiteralPath ".env.example" -Destination $staging
  Copy-Item -LiteralPath "infrastructure/nginx/nginx.conf" -Destination (Join-Path $staging "infrastructure/nginx/nginx.conf")
  Copy-Item -LiteralPath "scripts/install-offline.ps1" -Destination (Join-Path $staging "scripts/install-offline.ps1")
  Copy-Item -LiteralPath "scripts/generate-lan-cert.ps1" -Destination (Join-Path $staging "scripts/generate-lan-cert.ps1")
  Copy-Item -LiteralPath "scripts/install-offline.sh" -Destination (Join-Path $staging "scripts/install-offline.sh")
  Copy-Item -LiteralPath "scripts/generate-lan-cert.sh" -Destination (Join-Path $staging "scripts/generate-lan-cert.sh")
  Copy-Item -LiteralPath "docs/lan-setup.md" -Destination (Join-Path $staging "docs/lan-setup.md")
  Copy-Item -LiteralPath "docs/offline-bundle.md" -Destination (Join-Path $staging "docs/offline-bundle.md")

  & $containerEngine image save --output (Join-Path $staging "images.tar") $images
  if ($LASTEXITCODE -ne 0) {
    throw "Could not export Docker images."
  }

  $imageTarHash = (Get-FileHash -LiteralPath (Join-Path $staging "images.tar") -Algorithm SHA256).Hash.ToLowerInvariant()
  $manifest = [ordered]@{
    product = "plan-self"
    version = $Version
    createdAt = (Get-Date).ToUniversalTime().ToString("o")
    images = $images
    imagesSha256 = $imageTarHash
  }
  $manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $staging "manifest.json") -Encoding ascii

  tar.exe -cf $archivePath -C $staging .
  if ($LASTEXITCODE -ne 0) {
    throw "Could not create release archive."
  }

  $archiveHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
  Set-Content -LiteralPath $checksumPath -Value "$archiveHash  $(Split-Path -Leaf $archivePath)" -Encoding ascii
} finally {
  $resolvedStaging = [System.IO.Path]::GetFullPath($staging)
  $resolvedTemp = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
  if ($resolvedStaging.StartsWith($resolvedTemp, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $resolvedStaging)) {
    Remove-Item -LiteralPath $resolvedStaging -Recurse -Force
  }
}

Write-Host "Offline bundle created: $archivePath"
Write-Host "Checksum: $checksumPath"
