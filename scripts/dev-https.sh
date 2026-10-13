#!/usr/bin/env bash
set -euo pipefail

ip="${1:?Usage: npm run dev:https -- YOUR_PHONE_REACHABLE_LAN_IP}"
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
