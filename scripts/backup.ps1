param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot '..\backups'),
  [ValidateSet('auto', 'podman', 'docker')][string]$Engine = 'auto'
)

$ErrorActionPreference = 'Stop'
$engineCommand = if ($Engine -ne 'auto') { $Engine } elseif (Get-Command podman -ErrorAction SilentlyContinue) { 'podman' } else { 'docker' }
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outputRoot = [IO.Path]::GetFullPath($OutputDirectory)
$stage = Join-Path ([IO.Path]::GetTempPath()) "plan-self-backup-$stamp-$([guid]::NewGuid().ToString('N'))"
$archive = Join-Path $outputRoot "plan-self-backup-$stamp.zip"
$stopped = @('plan-self_gateway_1', 'plan-self_worker_1', 'plan-self_api_1')

New-Item -ItemType Directory -Force -Path $outputRoot, $stage | Out-Null
try {
  & $engineCommand stop @stopped | Out-Null
  & $engineCommand exec plan-self_postgres_1 pg_dump -U plan-self -d plan_self -Fc -f /tmp/plan-self-database.dump
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao exportar PostgreSQL' }
  & $engineCommand cp 'plan-self_postgres_1:/tmp/plan-self-database.dump' (Join-Path $stage 'database.dump')

  & $engineCommand start plan-self_api_1 | Out-Null
  & $engineCommand exec plan-self_api_1 tar -C /data/files -czf /tmp/plan-self-files.tar.gz .
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao exportar arquivos locais' }
  & $engineCommand cp 'plan-self_api_1:/tmp/plan-self-files.tar.gz' (Join-Path $stage 'files.tar.gz')

  $databaseHash = (Get-FileHash (Join-Path $stage 'database.dump') -Algorithm SHA256).Hash.ToLowerInvariant()
  $filesHash = (Get-FileHash (Join-Path $stage 'files.tar.gz') -Algorithm SHA256).Hash.ToLowerInvariant()
  [ordered]@{
    formatVersion = 1
    createdAt = (Get-Date).ToUniversalTime().ToString('o')
    databaseSha256 = $databaseHash
    filesSha256 = $filesHash
  } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $stage 'manifest.json') -Encoding utf8

  Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $archive -CompressionLevel Optimal
  (Get-FileHash $archive -Algorithm SHA256).Hash.ToLowerInvariant() | Set-Content -LiteralPath "$archive.sha256" -Encoding ascii
  Write-Host "Backup criado: $archive"
} finally {
  & $engineCommand exec plan-self_postgres_1 rm -f /tmp/plan-self-database.dump 2>$null
  & $engineCommand exec plan-self_api_1 rm -f /tmp/plan-self-files.tar.gz 2>$null
  & $engineCommand start plan-self_api_1 plan-self_gateway_1 plan-self_worker_1 | Out-Null
  Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
}
