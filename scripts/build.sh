#!/bin/bash
# DSH Group Chat Plugin Build Script
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DSH_GLOBAL_NPM="C:/Users/Administrator/AppData/Roaming/npm/node_modules/@deepseek-ai/dsh/node_modules"
STEALTH_BIN="C:/Users/Administrator/.dsh/plugins/dsh-stealth-browser/node_modules/.bin"

mkdir -p node_modules

node -e "
const fs = require('fs');
const path = require('path');

function ensureLink(target, linkPath) {
  try {
    if (fs.existsSync(linkPath)) return;
    fs.mkdirSync(path.dirname(linkPath), { recursive: true });
    fs.symlinkSync(target, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
  } catch (e) {}
}

const globalNpm = '$DSH_GLOBAL_NPM';
if (fs.existsSync(globalNpm)) {
  ensureLink(path.join(globalNpm, '@deepseek-ai'), path.resolve('node_modules/@deepseek-ai'));
  ensureLink(path.join(globalNpm, '@types'), path.resolve('node_modules/@types'));
  ensureLink(path.join(globalNpm, 'cordis'), path.resolve('node_modules/cordis'));
  ensureLink(path.join(globalNpm, 'schemastery'), path.resolve('node_modules/schemastery'));
  ensureLink(path.join(globalNpm, 'cosmokit'), path.resolve('node_modules/cosmokit'));
}
"

TSC=""
if [ -x "node_modules/.bin/tsc" ] || [ -f "node_modules/.bin/tsc.cmd" ]; then
  TSC="node_modules/.bin/tsc"
elif [ -f "$STEALTH_BIN/tsc.cmd" ]; then
  TSC="$STEALTH_BIN/tsc.cmd"
elif [ -n "${DSH_CHECKOUT:-}" ] && [ -x "$DSH_CHECKOUT/node_modules/.bin/tsc" ]; then
  TSC="$DSH_CHECKOUT/node_modules/.bin/tsc"
elif which tsc >/dev/null 2>&1; then
  TSC="tsc"
fi

if [ -z "$TSC" ]; then
  echo "build: cannot find tsc compiler" >&2
  exit 1
fi

echo "=== Compiling src -> lib (tsc: $TSC) ==="
"$TSC" -p tsconfig.json
echo "=== Host build complete ==="

TSDOWN=""
if [ -x "node_modules/.bin/tsdown" ] || [ -f "node_modules/.bin/tsdown.cmd" ]; then
  TSDOWN="node_modules/.bin/tsdown"
elif [ -f "$STEALTH_BIN/tsdown.cmd" ]; then
  TSDOWN="$STEALTH_BIN/tsdown.cmd"
elif which tsdown >/dev/null 2>&1; then
  TSDOWN="tsdown"
fi

if [ -n "$TSDOWN" ]; then
  echo "=== Bundling client -> lib/client.js (tsdown: $TSDOWN) ==="
  "$TSDOWN"
  echo "=== Client bundle complete ==="
fi

