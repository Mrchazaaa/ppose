#!/usr/bin/env bash
# Example: ./eng/dev.sh
set -e
cd "$(dirname "$0")/.."
exec npm run dev -- "$@"
