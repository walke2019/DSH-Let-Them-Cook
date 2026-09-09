from pathlib import Path
folder=Path('Docs/ui-followup-repair')
(folder/'package.py').write_text(r'''
from pathlib import Path
import json,difflib,zipfile
root=Path.cwd();folder=root/'Docs/ui-followup-repair';old=folder/'original'
paths=sorted({str(p.relative_to(root)).replace('\\','/') for d in ['src','lib'] for p in (root/d).rglob('*') if p.is_file()}|{str(p.relative_to(old)).replace('\\','/') for d in ['src','lib'] for p in (old/d).rglob('*') if p.is_file()})
changed=[p for p in paths if not (old/p).exists() or not (root/p).exists() or (old/p).read_bytes()!=(root/p).read_bytes()]
(folder/'manifest.json').write_text(json.dumps(changed,indent=2),encoding='utf-8')
with zipfile.ZipFile(folder/'MODIFIED_FILE.zip','w',zipfile.ZIP_DEFLATED) as z:
    for p in changed:
        if (root/p).exists(): z.write(root/p,p)
diff=''
for p in changed:
    a=(old/p).read_text(encoding='utf-8-sig').splitlines(True) if (old/p).exists() else []
    b=(root/p).read_text(encoding='utf-8-sig').splitlines(True) if (root/p).exists() else []
    diff+=''.join(difflib.unified_diff(a,b,fromfile='a/'+p,tofile='b/'+p))
(folder/'DIFF_FILE.patch').write_text(diff,encoding='utf-8')
print('packaged',len(changed),'changed plugin files')
''',encoding='utf-8')
(folder/'ROLLBACK.sh').write_text('#!/usr/bin/env bash\nset -euo pipefail\nHERE="$(cd -- "$(dirname -- "$0")" && pwd)"\n: "${1:?Pass the plugin directory to restore}"\npython "$HERE/rollback.py" "$1"\n',encoding='utf-8',newline='\n')
(folder/'rollback.py').write_text(r'''
from pathlib import Path
import sys,json,shutil
folder=Path(__file__).resolve().parent;target=Path(sys.argv[1]).resolve()
assert (target/'src/index.ts').exists(), 'Expected a plugin tree'
paths=json.loads((folder/'manifest.json').read_text(encoding='utf-8'))
for name in paths:
    dest=(target/name).resolve();assert target in dest.parents
    src=folder/'original'/name
    if src.exists():dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest)
    elif dest.exists():dest.unlink()
for name in paths:
    src=folder/'original'/name;dest=target/name
    assert src.exists()==dest.exists()
    if src.exists():assert src.read_bytes()==dest.read_bytes()
print('ROLLBACK PASS: ui follow-up plugin files restored byte-for-byte')
''',encoding='utf-8')
