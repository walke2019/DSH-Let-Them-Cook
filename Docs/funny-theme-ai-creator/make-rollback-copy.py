from pathlib import Path
import shutil
root=Path.cwd(); d=root/'Docs'/'funny-theme-ai-creator'; t=d/'rollback-test-current'
if t.exists(): shutil.rmtree(t)
for folder in ['src','lib']:
    shutil.copytree(root/folder,t/folder)
print(t)
