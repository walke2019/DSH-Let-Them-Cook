from pathlib import Path
import zipfile, difflib, json
root=Path.cwd(); d=root/'Docs'/'scheduling-help-workspace-scope'
changed=['src/index.ts','src/client/GroupChatSideDock.tsx','src/engine/model-settings.ts','src/engine/workspace-settings.ts','lib/index.js','lib/index.js.map','lib/client.js','lib/client.js.map','lib/engine/model-settings.js','lib/engine/model-settings.js.map','lib/engine/workspace-settings.js','lib/engine/workspace-settings.js.map','lib/types/engine/model-settings.d.ts','lib/types/engine/workspace-settings.d.ts','Docs/scheduling-help-workspace-scope/dispatch-mode-qa.md','.pm-workflow/dsh-group-chat/rooms.json','.pm-workflow/dsh-group-chat/model-settings.json']
parts=[]
for f in changed:
    cur=root/f; old=d/'original'/f
    a=old.read_text(encoding='utf-8', errors='replace').splitlines(True) if old.exists() else []
    b=cur.read_text(encoding='utf-8', errors='replace').splitlines(True) if cur.exists() else []
    if a!=b:
        parts.extend(difflib.unified_diff(a,b,fromfile=(f'a/{f}' if old.exists() else '/dev/null'),tofile=f'b/{f}'))
(d/'DIFF_FILE.patch').write_text(''.join(parts), encoding='utf-8')
with zipfile.ZipFile(d/'MODIFIED_FILE.zip','w',compression=zipfile.ZIP_DEFLATED) as z:
    for f in changed:
        p=root/f
        if p.exists(): z.write(p,f)
rb=r'''#!/usr/bin/env bash
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
'''
(d/'ROLLBACK.sh').write_text(rb, encoding='utf-8')
with zipfile.ZipFile(d/'MODIFIED_FILE.zip') as z:
    assert z.testzip() is None
    for f in z.namelist(): assert z.read(f)==(root/f).read_bytes(), f
print(json.dumps({'entries':len(zipfile.ZipFile(d/'MODIFIED_FILE.zip').namelist()),'diffBytes':(d/'DIFF_FILE.patch').stat().st_size},ensure_ascii=False))
