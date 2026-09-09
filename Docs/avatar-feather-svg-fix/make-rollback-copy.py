from pathlib import Path
import shutil
root=Path.cwd(); d=root/'Docs'/'avatar-feather-svg-fix'; t=d/'rollback-test-current'
if t.exists(): shutil.rmtree(t)
shutil.copytree(root/'src',t/'src')
shutil.copytree(root/'lib',t/'lib')
print(t)
