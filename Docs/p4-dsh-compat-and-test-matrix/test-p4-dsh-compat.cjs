const fs = require('fs');
const path = require('path');
const root = process.cwd();
function read(p){ return fs.readFileSync(path.join(root,p),'utf8'); }
function assert(cond,msg){ if(!cond){ console.error('FAIL '+msg); process.exitCode=1; } else { console.log('PASS '+msg); } }
const compat = read('src/compat/dsh.ts');
const index = read('src/index.ts');
const runtime = read('src/engine/agent-runtime.ts');
const pkg = JSON.parse(read('package.json'));
assert(compat.includes('export function detectDshCompat'), 'compat detects DSH capabilities');
assert(compat.includes('export async function safeListModelCatalog'), 'compat safely lists model catalog');
assert(compat.includes('export function getCurrentModel'), 'compat safely reads current model');
assert(compat.includes('export function resolveToolScope'), 'compat resolves semantic tool aliases');
assert(compat.includes('export function restrictToolsCompat'), 'compat wraps tools.restrict');
assert(index.includes("pathname==='/compat'"), 'API exposes /compat endpoint');
assert(index.includes('safeListModelCatalog(ctx)') && index.includes('catalogWarnings'), 'models API uses compat catalog and returns warnings');
assert(runtime.includes('restrictToolsCompat') && runtime.includes('getCurrentModel'), 'agent runtime uses compat functions');
assert(pkg.scripts['test:matrix'] === 'node scripts/test-matrix.cjs', 'package exposes test:matrix');
assert(pkg.scripts['smoke:api'] === 'node scripts/api-smoke.cjs', 'package exposes smoke:api');
assert(fs.existsSync(path.join(root,'scripts/test-matrix.cjs')), 'test matrix script exists');
assert(fs.existsSync(path.join(root,'scripts/api-smoke.cjs')), 'api smoke script exists');
if(process.exitCode){ process.exit(process.exitCode); }
console.log('P4_DSH_COMPAT_TEST_EXIT:0');
