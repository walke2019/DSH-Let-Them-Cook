from pathlib import Path
import sys,json,shutil,hashlib
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
print('ROLLBACK PASS: original plugin files restored byte-for-byte')
