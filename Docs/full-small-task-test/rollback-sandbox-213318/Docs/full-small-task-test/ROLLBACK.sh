#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BASE="$ROOT/Docs/full-small-task-test/original"
cp "$BASE/src/client/GroupChatSideDock.tsx" "$ROOT/src/client/GroupChatSideDock.tsx"
cp "$BASE/lib/client.js" "$ROOT/lib/client.js"
cp "$BASE/lib/client.js.map" "$ROOT/lib/client.js.map"
echo "ROLLBACK_OK restored GroupChatSideDock.tsx, lib/client.js, lib/client.js.map"
