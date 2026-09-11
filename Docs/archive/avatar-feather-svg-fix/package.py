from pathlib import Path
import zipfile,difflib,json,shutil
root=Path.cwd(); d=root/'Docs'/'avatar-feather-svg-fix'
changed=['src/client/AvatarBadge.tsx','src/client/GroupChatSideDock.tsx','src/client/GroupChatPanel.tsx','src/client/GroupChatComposer.tsx','src/client/GroupChatRoleEditor.tsx','lib/client.js','lib/client.js.map']
parts=[]
for f in changed:
    cur=root/f; old=d/'original'/f
    a=old.read_text(encoding='utf-8',errors='replace').splitlines(True) if old.exists() else []
    b=cur.read_text(encoding='utf-8',errors='replace').splitlines(True) if cur.exists() else []
    if a!=b: parts.extend(difflib.unified_diff(a,b,fromfile=(f'a/{f}' if old.exists() else '/dev/null'),tofile=f'b/{f}'))
(d/'DIFF_FILE.patch').write_text(''.join(parts),encoding='utf-8')
with zipfile.ZipFile(d/'MODIFIED_FILE.zip','w',compression=zipfile.ZIP_DEFLATED) as z:
    for f in changed+['Docs/avatar-feather-svg-fix/check.cjs','Docs/avatar-feather-svg-fix/ui-avatar.js']:
        p=root/f
        if p.exists(): z.write(p,f)
rb=r'''#!/usr/bin/env bash
set -euo pipefail
TARGET="${1:-.}"
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/original"
copy_if(){ if [ -f "$BASE/$1" ]; then mkdir -p "$(dirname "$TARGET/$1")"; cp "$BASE/$1" "$TARGET/$1"; fi; }
copy_if src/client/GroupChatSideDock.tsx
copy_if src/client/GroupChatPanel.tsx
copy_if src/client/GroupChatComposer.tsx
copy_if src/client/GroupChatRoleEditor.tsx
copy_if lib/client.js
rm -f "$TARGET/src/client/AvatarBadge.tsx"
echo "ROLLBACK PASS: avatar feather svg changes restored"
'''
(d/'ROLLBACK.sh').write_text(rb,encoding='utf-8')
with zipfile.ZipFile(d/'MODIFIED_FILE.zip') as z:
    assert z.testzip() is None
    for f in z.namelist(): assert z.read(f)==(root/f).read_bytes(), f
print(json.dumps({'entries':len(zipfile.ZipFile(d/'MODIFIED_FILE.zip').namelist()),'diffBytes':(d/'DIFF_FILE.patch').stat().st_size,'rollbackBytes':(d/'ROLLBACK.sh').stat().st_size},ensure_ascii=False))
