const fs = require('fs');
const path = require('path');
const root = process.argv[2] || '.';
const read = p => fs.existsSync(path.join(root,p)) ? fs.readFileSync(path.join(root,p),'utf8') : '';
const checks = [
  ['runtime skill source exists', fs.existsSync(path.join(root,'src/skills/dsh-group-chat-orchestrator/SKILL.md'))],
  ['runtime skill says not codex', read('src/skills/dsh-group-chat-orchestrator/SKILL.md').includes('不是 Codex')],
  ['runtime skill injected into projection', read('src/engine/projection.ts').includes('ORCHESTRATOR_RUNTIME_SKILL_SUMMARY')],
  ['tool routing policy in engine', read('src/engine/auto-setup.ts').includes('DEFAULT_TOOL_ROUTING_POLICY') && read('src/engine/auto-setup.ts').includes("webSearchOwner: 'researcher'" )],
  ['model capability hints in engine', read('src/types.ts').includes('ModelCapability') && read('src/engine/auto-setup.ts').includes('DEFAULT_ROLE_MODEL_HINTS')],
  ['workflow parallelism preserved in policy', read('src/types.ts').includes('allowStageParallelism') && read('src/engine/auto-setup.ts').includes('allowStageParallelism: true')],
  ['AGENTS synced', read('AGENTS.md').includes('工具专员归口') && read('AGENTS.md').includes('保留 DSH workflow 并发')],
  ['Docs synced', read('Docs/orchestrator-skill-and-policy.md').includes('不是给 Codex 开发助手自动调用的 Skill') && read('Docs/dispatch-engine.md').includes('阶段并发保留')],
];
for (const [name, ok] of checks) console.log(`${ok?'PASS':'FAIL'} ${name}`);
process.exit(checks.every(([,ok])=>ok)?0:1);
