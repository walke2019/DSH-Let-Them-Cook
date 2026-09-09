#!/usr/bin/env bash
set -euo pipefail
here="$(cd -- "$(dirname -- "$0")" && pwd)"
target="${1:?Usage: ROLLBACK.sh target-project-copy}"
target="$(cd -- "$target" && pwd)"
[ -f "$target/src/index.ts" ] && [ -d "$target/lib" ] || exit 2
for f in src/index.ts src/engine/room-manager.ts src/engine/resilience.ts lib/index.js lib/index.js.map lib/types/index.d.ts lib/engine/room-manager.js lib/engine/room-manager.js.map lib/types/engine/room-manager.d.ts lib/engine/resilience.js lib/engine/resilience.js.map lib/types/engine/resilience.d.ts; do
  cp -- "$here/original/$f" "$target/$f"
  cmp -s -- "$here/original/$f" "$target/$f"
done
for f in src/engine/agent-runtime.ts lib/engine/agent-runtime.js lib/engine/agent-runtime.js.map lib/types/engine/agent-runtime.d.ts; do
  rm -f -- "$target/$f"
done
printf '%s\n' 'PASS: original source and host build restored'
