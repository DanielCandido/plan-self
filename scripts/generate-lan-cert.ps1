param(
  [string]$Hostname = "plan-self.home.arpa",
  [string]$IpAddress = "",
  [string]$OutputDirectory = "infrastructure/pki"
)

$ErrorActionPreference = "Stop"

$opensslCommand = Get-Command openssl -ErrorAction SilentlyContinue
if ($opensslCommand) {
  $opensslPath = $opensslCommand.Source
} else {
  $gitCommand = Get-Command git -ErrorAction SilentlyContinue
  $candidates = @("C:\Program Files\Git\usr\bin\openssl.exe")
  if ($gitCommand) {
    $gitRoot = Split-Path -Parent (Split-Path -Parent $gitCommand.Source)
    $candidates = @(
      (Join-Path $gitRoot "mingw64/bin/openssl.exe"),
      (Join-Path $gitRoot "usr/bin/openssl.exe")
    ) + $candidates
  }

  $opensslPath = $candidates |
    Where-Object { Test-Path -LiteralPath $_ } |
    Select-Object -First 1

  if (-not $opensslPath) {
    throw "OpenSSL was not found. Install Git for Windows or OpenSSL and run this script again."
  }
}

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$resolvedOutput = (Resolve-Path -LiteralPath $OutputDirectory).Path
$configPath = Join-Path $resolvedOutput "server-openssl.cnf"

$sanLines = @("DNS.1 = $Hostname")
if ($IpAddress) {
  $sanLines += "IP.1 = $IpAddress"
}

$config = @(
  "[req]",
  "prompt = no",
  "distinguished_name = dn",
  "req_extensions = req_ext",
  "",
  "[dn]",
  "CN = $Hostname",
  "",
  "[req_ext]",
  "subjectAltName = @alt_names",
  "keyUsage = critical, digitalSignature, keyEncipherment",
  "extendedKeyUsage = serverAuth",
  "",
  "[alt_names]"
) + $sanLines

Set-Content -LiteralPath $configPath -Value $config -Encoding ascii

$rootKey = Join-Path $resolvedOutput "root-ca.key"
$rootCert = Join-Path $resolvedOutput "root-ca.crt"
$serverKey = Join-Path $resolvedOutput "server.key"
$serverCsr = Join-Path $resolvedOutput "server.csr"
$serverCert = Join-Path $resolvedOutput "server.crt"

& $opensslPath genrsa -out $rootKey 4096
& $opensslPath req -x509 -new -nodes -key $rootKey -sha256 -days 3650 -out $rootCert -subj "/CN=Plan Self LAN Root CA"
& $opensslPath genrsa -out $serverKey 2048
& $opensslPath req -new -key $serverKey -out $serverCsr -config $configPath
& $opensslPath x509 -req -in $serverCsr -CA $rootCert -CAkey $rootKey -CAcreateserial -out $serverCert -days 825 -sha256 -extensions req_ext -extfile $configPath

Remove-Item -LiteralPath $serverCsr, $configPath -Force
$serialFile = Join-Path $resolvedOutput "root-ca.srl"
if (Test-Path -LiteralPath $serialFile) {
  Remove-Item -LiteralPath $serialFile -Force
}

Write-Host "LAN certificate generated for $Hostname"
Write-Host "Install $rootCert as a trusted root CA on each client device."
Write-Host "Keep $rootKey private and include it only in protected backups."

