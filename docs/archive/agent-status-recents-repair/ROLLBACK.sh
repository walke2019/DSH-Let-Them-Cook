#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd -- "$(dirname -- "$0")" && pwd)"
: "${1:?Pass the plugin directory to restore}"
python "$HERE/rollback.py" "$1"
