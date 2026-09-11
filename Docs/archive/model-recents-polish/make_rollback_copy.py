from pathlib import Path
import shutil
root=Path.cwd();dst=root/'Docs/model-recents-polish/rollback-test'
if dst.exists():shutil.rmtree(dst)
dst.mkdir(parents=True)
shutil.copytree(root/'src',dst/'src');shutil.copytree(root/'lib',dst/'lib')
print(dst)
