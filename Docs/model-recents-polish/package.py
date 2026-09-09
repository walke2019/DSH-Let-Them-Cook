from pathlib import Path
import json,difflib,zipfile
root=Path.cwd();folder=root/'Docs/model-recents-polish';old=folder/'original'
paths=sorted({str(p.relative_to(root)).replace('\\','/') for d in ['src','lib'] for p in (root/d).rglob('*') if p.is_file()}|{str(p.relative_to(old)).replace('\\','/') for d in ['src','lib'] for p in (old/d).rglob('*') if p.is_file()})
changed=[p for p in paths if not (old/p).exists() or not (root/p).exists() or (old/p).read_bytes()!=(root/p).read_bytes()]
(folder/'manifest.json').write_text(json.dumps(changed,indent=2),encoding='utf-8')
with zipfile.ZipFile(folder/'MODIFIED_FILE.zip','w',zipfile.ZIP_DEFLATED) as z:
  for p in changed:
    if (root/p).exists():z.write(root/p,p)
diff=''
for p in changed:
  a=(old/p).read_text(encoding='utf-8-sig').splitlines(True) if (old/p).exists() else []
  b=(root/p).read_text(encoding='utf-8-sig').splitlines(True) if (root/p).exists() else []
  diff+=''.join(difflib.unified_diff(a,b,fromfile='a/'+p,tofile='b/'+p))
(folder/'DIFF_FILE.patch').write_text(diff,encoding='utf-8')
print('packaged',len(changed),'changed plugin files')
