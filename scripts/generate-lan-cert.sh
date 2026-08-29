#!/usr/bin/env bash
set -euo pipefail

LAN_HOSTNAME="${1:-plan-self.home.arpa}"
LAN_IP_ADDRESS="${2:-}"
OUTPUT_DIRECTORY="${3:-infrastructure/pki}"

if ! command -v openssl >/dev/null 2>&1; then
  echo "OpenSSL is required to generate the LAN certificate." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIRECTORY"
OUTPUT_DIRECTORY="$(cd "$OUTPUT_DIRECTORY" && pwd)"
CONFIG_PATH="$OUTPUT_DIRECTORY/server-openssl.cnf"

cat >"$CONFIG_PATH" <<EOF
[req]
prompt = no
distinguished_name = dn
req_extensions = req_ext

[dn]
CN = $LAN_HOSTNAME

[req_ext]
subjectAltName = @alt_names
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[alt_names]
DNS.1 = $LAN_HOSTNAME
EOF

if [[ -n "$LAN_IP_ADDRESS" ]]; then
  printf 'IP.1 = %s\n' "$LAN_IP_ADDRESS" >>"$CONFIG_PATH"
fi

openssl genrsa -out "$OUTPUT_DIRECTORY/root-ca.key" 4096
openssl req -x509 -new -nodes \
  -key "$OUTPUT_DIRECTORY/root-ca.key" \
  -sha256 -days 3650 \
  -out "$OUTPUT_DIRECTORY/root-ca.crt" \
  -subj "/CN=Plan Self LAN Root CA"

openssl genrsa -out "$OUTPUT_DIRECTORY/server.key" 2048
openssl req -new \
  -key "$OUTPUT_DIRECTORY/server.key" \
  -out "$OUTPUT_DIRECTORY/server.csr" \
  -config "$CONFIG_PATH"

openssl x509 -req \
  -in "$OUTPUT_DIRECTORY/server.csr" \
  -CA "$OUTPUT_DIRECTORY/root-ca.crt" \
  -CAkey "$OUTPUT_DIRECTORY/root-ca.key" \
  -CAcreateserial \
  -out "$OUTPUT_DIRECTORY/server.crt" \
  -days 825 -sha256 \
  -extensions req_ext \
  -extfile "$CONFIG_PATH"

rm -f "$OUTPUT_DIRECTORY/server.csr" "$OUTPUT_DIRECTORY/root-ca.srl" "$CONFIG_PATH"
chmod 600 "$OUTPUT_DIRECTORY/root-ca.key" "$OUTPUT_DIRECTORY/server.key"

echo "LAN certificate generated for $LAN_HOSTNAME"
echo "Install $OUTPUT_DIRECTORY/root-ca.crt as a trusted root CA on each client."
echo "Keep root-ca.key private and include it only in protected backups."

