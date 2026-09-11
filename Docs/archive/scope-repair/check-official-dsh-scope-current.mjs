import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFile, writeFile, unlink } from 'node:fs/promises';
const dsh = createRequire(process.env.APPDATA + '/npm/node_modules/@deepseek-ai/dsh/package.json');
const basePkg = dsh.resolve('@deepseek-ai/dsh-base/package.json');
const webPkg = dsh.resolve('@deepseek-ai/dsh-web-app/package.json');
const baseDir = dirname(basePkg), webDir = dirname(webPkg);
const files = [join(baseDir, 'scope-probe-temp.mjs'), join(webDir, 'scope-probe-temp.mjs')];
try {
  for (const f of files) await writeFile(f, "export * from '@deepseek-ai/dsh-scope';\n");
  const a = await import(pathToFileURL(files[0]));
  const b = await import(pathToFileURL(files[1]));
  const base = createRequire(basePkg);
  const { Context } = await import(pathToFileURL(base.resolve('@deepseek-ai/cordis')));
  const ctx = new Context(); const key = {}; const scope = a.createScope(ctx, key);
  const shared = b.scopeOf(scope.ctx) === key;
  await scope.dispose();
  console.log(JSON.stringify({shared, basePkg, webPkg, aScope: base.resolve('@deepseek-ai/dsh-scope/package.json'), webScope: createRequire(webPkg).resolve('@deepseek-ai/dsh-scope/package.json')}));
  process.exitCode = shared ? 0 : 1;
} finally { for (const f of files) await unlink(f).catch(()=>{}); }
