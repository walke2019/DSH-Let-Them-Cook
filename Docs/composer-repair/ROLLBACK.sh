#!/usr/bin/env bash
set -euo pipefail
here="$(cd -- "$(dirname -- "$0")" && pwd)"
target="${1:?Usage: ROLLBACK.sh target-project-copy}"
target="$(cd -- "$target" && pwd)"
[ -d "$target/src/client" ] && [ -d "$target/lib" ] || exit 2
cp -- "$here/original/GroupChatPanel.tsx" "$target/src/client/GroupChatPanel.tsx"
cmp -s -- "$here/original/GroupChatPanel.tsx" "$target/src/client/GroupChatPanel.tsx"
rm -f -- "$target/src/client/GroupChatComposer.tsx"
for f in client.js client.js.map; do
  cp -- "$here/original/$f" "$target/lib/$f"
  cmp -s -- "$here/original/$f" "$target/lib/$f"
done
printf '%s\n' 'PASS: original composer restored'
