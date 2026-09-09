const fs = require('fs');
const path = require('path');
const root = process.cwd();
function read(p){ return fs.readFileSync(path.join(root,p),'utf8'); }
function assert(cond,msg){ if(!cond){ console.error('FAIL '+msg); process.exitCode=1; } else { console.log('PASS '+msg); } }
const recommender = read('src/engine/model-recommender.ts');
const index = read('src/index.ts');
const client = read('src/client/GroupChatModelSettings.tsx');
assert(recommender.includes('export function recommendModelsForRole'), 'recommender exports per-role scoring');
assert(recommender.includes('export function recommendModelsForRoles'), 'recommender exports all-role scoring');
assert(recommender.includes('CAPABILITY_PATTERNS'), 'recommender has capability patterns');
assert(recommender.includes('sourceBoost') && recommender.includes("item.source === 'manual'"), 'recommender weights manual/recent/current sources');
assert(recommender.includes('scoreLatency') && recommender.includes('scoreCost'), 'recommender scores cost and latency preferences');
assert(index.includes('recommendModelsForRoles') && index.includes('recommendations'), 'models API returns recommendations');
assert(index.includes('manualByRole') && index.includes('modelSettings.recent()') && index.includes('current'), 'models API uses manual, recent and current models');
assert(client.includes('recommendations?:Record<string,ModelRecommendation[]>'), 'client catalog accepts recommendations');
assert(client.includes('catalog.recommendations?.[role.id]'), 'client uses server recommendations per role');
assert(client.includes('m.score') && client.includes('matchedCapabilities'), 'client displays recommendation score and capabilities');
if(process.exitCode){ process.exit(process.exitCode); }
console.log('P3_MODEL_RECOMMENDER_TEST_EXIT:0');
