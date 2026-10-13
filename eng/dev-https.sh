#!/usr/bin/env bash
# Example: ./eng/dev-https.sh (or ./eng/dev-https.sh 192.168.1.227 to choose an IP)
set -euo pipefail
cd "$(dirname "$0")/.."

ip="${1:-}"
if [[ -z "$ip" ]]; then
  route=$(ip -4 route get 1.1.1.1 2>/dev/null) && [[ $route =~ [[:space:]]src[[:space:]]([0-9.]+) ]] || {
    echo 'Could not determine local IP; pass your phone-reachable LAN IP as an argument.' >&2
    exit 1
  }
  ip="${BASH_REMATCH[1]}"
fi
mkdir -p .cert

if [[ ! -f .cert/local-ca.key ]]; then
  openssl req -x509 -newkey rsa:2048 -noenc -sha256 -days 3650 \
    -keyout .cert/local-ca.key -out .cert/local-ca.crt \
    -subj '/CN=ppose local testing CA' \
    -addext 'basicConstraints=critical,CA:TRUE' \
    -addext 'keyUsage=critical,keyCertSign,cRLSign'
fi
openssl x509 -in .cert/local-ca.crt -outform DER -out .cert/local-ca.cer

openssl req -newkey rsa:2048 -noenc -keyout .cert/server.key -out .cert/server.csr \
  -subj "/CN=$ip" -addext "subjectAltName=IP:$ip,DNS:localhost" \
  -addext 'extendedKeyUsage=serverAuth'
openssl x509 -req -in .cert/server.csr -CA .cert/local-ca.crt \
  -CAkey .cert/local-ca.key -CAcreateserial -out .cert/server.crt \
  -days 365 -sha256 -copy_extensions copy

chmod 600 .cert/*.key
echo "Trust .cert/local-ca.crt (Android) or .cert/local-ca.cer (iPhone) on your phone, then open https://$ip:5173/"
PPOSE_HTTPS=1 npm run dev -- --strictPort
