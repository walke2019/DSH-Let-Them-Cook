import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const root=join(process.env.APPDATA,'npm/node_modules/@deepseek-ai');
const base=createRequire(join(root,'dsh-base/package.json'));
const web=createRequire(join(root,'dsh-web-app/package.json'));
// Import by package specifier from each real consumer, as the running app does.
const {readFile,writeFile,unlink}=await import('node:fs/promises');
const files=[join(root,'dsh-base/scope-repair-probe.mjs'),join(root,'dsh-web-app/scope-repair-probe.mjs')];
try {
  for(const f of files) await writeFile(f,"export * from '@deepseek-ai/dsh-scope';\n");
  const a=await import(pathToFileURL(files[0])); const b=await import(pathToFileURL(files[1]));
  const {Context}=await import(pathToFileURL(base.resolve('@deepseek-ai/cordis')));
  const ctx=new Context(); const key={}; const scope=a.createScope(ctx,key);
  const shared=b.scopeOf(scope.ctx)===key;
  await scope.dispose();
  console.log(shared?'PASS: web recognizes agent scope':'FAIL: web sees unscoped context');
  process.exitCode=shared?0:1;
} finally {for(const f of files) await unlink(f).catch(()=>{});}
