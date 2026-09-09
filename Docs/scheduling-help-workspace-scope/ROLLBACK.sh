#!/usr/bin/env bash
set -euo pipefail
TARGET="${1:-.}"
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/original"
copy_if(){ if [ -f "$BASE/$1" ]; then mkdir -p "$(dirname "$TARGET/$1")"; cp "$BASE/$1" "$TARGET/$1"; fi; }
copy_if src/index.ts
copy_if src/client/GroupChatSideDock.tsx
copy_if src/engine/model-settings.ts
copy_if src/engine/room-manager.ts
copy_if lib/index.js
copy_if lib/client.js
rm -f "$TARGET/src/engine/workspace-settings.ts" "$TARGET/lib/engine/workspace-settings.js" "$TARGET/lib/engine/workspace-settings.js.map" "$TARGET/lib/types/engine/workspace-settings.d.ts"
echo "ROLLBACK PASS: scheduling help and workspace scope changes restored"
