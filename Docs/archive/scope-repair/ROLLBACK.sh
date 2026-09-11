#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
target="${1:?Usage: ROLLBACK.sh target-copy.ps1}"
cp -- ORIGINAL.ps1 "$target"
cmp -s -- ORIGINAL.ps1 "$target"
printf '%s\n' 'PASS: original launcher restored'
