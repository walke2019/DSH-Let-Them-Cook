from pathlib import Path
import shutil
root=Path.cwd(); d=root/'Docs'/'scheduling-help-workspace-scope'; t=d/'rollback-test-current'
t.mkdir(parents=True, exist_ok=True)
for folder in ['src','lib']:
    src=root/folder
    dst=t/folder
    if src.exists(): shutil.copytree(src,dst,dirs_exist_ok=True)
print(t)
