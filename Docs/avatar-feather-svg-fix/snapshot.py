from pathlib import Path
import shutil, hashlib
root=Path.cwd(); d=root/'Docs'/'avatar-feather-svg-fix'
files=['src/client/GroupChatSideDock.tsx','src/client/GroupChatPanel.tsx','src/client/GroupChatComposer.tsx','src/client/GroupChatRoleEditor.tsx','lib/client.js','.pm-workflow/dsh-group-chat/rooms.json']
for f in files:
    p=root/f
    if p.exists():
        q=d/'original'/f; q.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(p,q)
lines=[]
for f in files:
    p=root/f
    if p.exists(): lines.append(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p))
(d/'original-hashes.txt').write_text('\n'.join(lines)+'\n', encoding='utf-8')
print((d/'original-hashes.txt').read_text(encoding='utf-8'))
