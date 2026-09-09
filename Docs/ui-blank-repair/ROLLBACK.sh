#!/usr/bin/env bash
set -euo pipefail
here="$(cd -- "$(dirname -- "$0")" && pwd)"
target="${1:?Usage: ROLLBACK.sh target-project-copy}"
target="$(cd -- "$target" && pwd)"
[ -d "$target/src/client" ] && [ -d "$target/lib" ] || exit 2
for f in index.ts layout-push.ts GroupChatPanel.tsx GroupChatSideDock.tsx; do
  cp -- "$here/original/client/$f" "$target/src/client/$f"
  cmp -s -- "$here/original/client/$f" "$target/src/client/$f"
done
for f in client.js client.js.map; do
  cp -- "$here/original/$f" "$target/lib/$f"
  cmp -s -- "$here/original/$f" "$target/lib/$f"
done
printf '%s\n' 'PASS: original client restored'
