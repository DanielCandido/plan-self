param(
  [Parameter(Mandatory = $true)][string]$BackupFile,
  [switch]$ConfirmRestore,
  [ValidateSet('auto', 'podman', 'docker')][string]$Engine = 'auto'
)

$ErrorActionPreference = 'Stop'
if (-not $ConfirmRestore) { throw 'Restauracao destrutiva bloqueada. Execute novamente com -ConfirmRestore.' }
$archive = [IO.Path]::GetFullPath($BackupFile)
if (-not (Test-Path -LiteralPath $archive -PathType Leaf)) { throw "Backup nao encontrado: $archive" }
$engineCommand = if ($Engine -ne 'auto') { $Engine } elseif (Get-Command podman -ErrorAction SilentlyContinue) { 'podman' } else { 'docker' }
$stage = Join-Path ([IO.Path]::GetTempPath()) "plan-self-restore-$([guid]::NewGuid().ToString('N'))"
$application = @('plan-self_nginx_1', 'plan-self_gateway_1', 'plan-self_worker_1', 'plan-self_web_1', 'plan-self_api_1')

New-Item -ItemType Directory -Path $stage | Out-Null
try {
  Expand-Archive -LiteralPath $archive -DestinationPath $stage
  $manifest = Get-Content -LiteralPath (Join-Path $stage 'manifest.json') -Raw | ConvertFrom-Json
  if ($manifest.formatVersion -ne 1) { throw 'Formato de backup nao suportado' }
  $databaseHash = (Get-FileHash (Join-Path $stage 'database.dump') -Algorithm SHA256).Hash.ToLowerInvariant()
  $filesHash = (Get-FileHash (Join-Path $stage 'files.tar.gz') -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($databaseHash -ne $manifest.databaseSha256 -or $filesHash -ne $manifest.filesSha256) { throw 'Checksum interno do backup invalido' }

  & $engineCommand stop @application | Out-Null
  & $engineCommand cp (Join-Path $stage 'database.dump') 'plan-self_postgres_1:/tmp/plan-self-database.dump'
  & $engineCommand exec plan-self_postgres_1 pg_restore -U plan-self -d plan_self --clean --if-exists --no-owner --no-privileges /tmp/plan-self-database.dump
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao restaurar PostgreSQL' }

  & $engineCommand start plan-self_api_1 | Out-Null
  & $engineCommand cp (Join-Path $stage 'files.tar.gz') 'plan-self_api_1:/tmp/plan-self-files.tar.gz'
  & $engineCommand exec plan-self_api_1 sh -c 'find /data/files -mindepth 1 -maxdepth 1 -exec rm -rf -- {} + && tar -C /data/files -xzf /tmp/plan-self-files.tar.gz'
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao restaurar arquivos locais' }
  & $engineCommand exec plan-self_api_1 rm -f /tmp/plan-self-files.tar.gz
  & $engineCommand exec plan-self_postgres_1 rm -f /tmp/plan-self-database.dump
  & $engineCommand start @application | Out-Null
  Write-Host 'Restauracao concluida. Verifique /health/ready antes de liberar o acesso.'
} finally {
  Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
}
