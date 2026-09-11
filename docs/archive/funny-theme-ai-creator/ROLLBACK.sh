#!/usr/bin/env bash
set -euo pipefail
TARGET="${1:-.}"
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/original"
copy_if(){ if [ -f "$BASE/$1" ]; then mkdir -p "$(dirname "$TARGET/$1")"; cp "$BASE/$1" "$TARGET/$1"; fi; }
copy_if src/types.ts
copy_if src/engine/themes.ts
copy_if src/engine/room-manager.ts
copy_if src/index.ts
copy_if src/client/GroupChatSideDock.tsx
copy_if lib/index.js
copy_if lib/client.js
copy_if lib/engine/themes.js
copy_if lib/engine/room-manager.js
copy_if lib/types/types.d.ts
rm -f "$TARGET/src/engine/theme-factory.ts" "$TARGET/lib/engine/theme-factory.js" "$TARGET/lib/engine/theme-factory.js.map" "$TARGET/lib/types/engine/theme-factory.d.ts"
echo "ROLLBACK PASS: funny theme and AI creator changes restored"
