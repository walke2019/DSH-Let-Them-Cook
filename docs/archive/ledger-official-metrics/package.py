from pathlib import Path
import zipfile,difflib,json
root=Path.cwd(); d=root/'Docs'/'ledger-official-metrics'
changed=['src/types.ts','src/index.ts','src/engine/room-manager.ts','src/engine/agent-runtime.ts','src/client/GroupChatSideDock.tsx','lib/index.js','lib/index.js.map','lib/client.js','lib/client.js.map','lib/engine/room-manager.js','lib/engine/room-manager.js.map','lib/engine/agent-runtime.js','lib/engine/agent-runtime.js.map','lib/types.js','lib/types.js.map','lib/types/types.d.ts','lib/types/engine/room-manager.d.ts','lib/types/engine/agent-runtime.d.ts']
parts=[]
for f in changed:
    cur=root/f; old=d/'original'/f
    a=old.read_text(encoding='utf-8',errors='replace').splitlines(True) if old.exists() else []
    b=cur.read_text(encoding='utf-8',errors='replace').splitlines(True) if cur.exists() else []
    if a!=b: parts.extend(difflib.unified_diff(a,b,fromfile=(f'a/{f}' if old.exists() else '/dev/null'),tofile=f'b/{f}'))
(d/'DIFF_FILE.patch').write_text(''.join(parts),encoding='utf-8')
with zipfile.ZipFile(d/'MODIFIED_FILE.zip','w',compression=zipfile.ZIP_DEFLATED) as z:
    for f in changed+['Docs/ledger-official-metrics/check.cjs','Docs/ledger-official-metrics/ledger-test.mjs','Docs/ledger-official-metrics/ui-ledger.js']:
        p=root/f
        if p.exists(): z.write(p,f)
rb=r'''#!/usr/bin/env bash
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
'''
(d/'ROLLBACK.sh').write_text(rb,encoding='utf-8')
with zipfile.ZipFile(d/'MODIFIED_FILE.zip') as z:
    assert z.testzip() is None
    for f in z.namelist(): assert z.read(f)==(root/f).read_bytes(), f
print(json.dumps({'entries':len(zipfile.ZipFile(d/'MODIFIED_FILE.zip').namelist()),'diffBytes':(d/'DIFF_FILE.patch').stat().st_size,'rollbackBytes':(d/'ROLLBACK.sh').stat().st_size},ensure_ascii=False))
