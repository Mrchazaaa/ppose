#!/usr/bin/env bash
# Example: ./eng/dev-live.sh
set -e
cd "$(dirname "$0")/.."
exec npx netlify-cli dev --live "$@"
