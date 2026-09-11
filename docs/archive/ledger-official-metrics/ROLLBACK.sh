#!/usr/bin/env bash
set -euo pipefail
TARGET="${1:-.}"
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/original"
copy_if(){ if [ -f "$BASE/$1" ]; then mkdir -p "$(dirname "$TARGET/$1")"; cp "$BASE/$1" "$TARGET/$1"; fi; }
copy_if src/types.ts
copy_if src/index.ts
copy_if src/engine/room-manager.ts
copy_if src/engine/agent-runtime.ts
copy_if src/client/GroupChatSideDock.tsx
copy_if lib/index.js
copy_if lib/client.js
copy_if lib/engine/room-manager.js
copy_if lib/engine/agent-runtime.js
copy_if lib/types.js
echo "ROLLBACK PASS: ledger official metrics changes restored"
