const fs = require('fs');
const root = process.argv[2] || '.';
const read = p => fs.readFileSync(require('path').join(root,p),'utf8');
const checks = [
  ['auto setup engine file exists', fs.existsSync(require('path').join(root,'src/engine/auto-setup.ts'))],
  ['message route classifies auto setup', read('src/index.ts').includes('classifyAutoSetupIntent')],
  ['draft is pending confirmation', read('src/index.ts').includes('待确认草案') && read('src/types.ts').includes('PendingAutoSetupDraft')],
  ['confirm applies pending setup', read('src/index.ts').includes('applyPendingAutoSetup')],
  ['master/subagent strategy defined', read('src/types.ts').includes('AgentOrchestrationStrategy') && read('src/engine/auto-setup.ts').includes('master_subagents')],
];
for (const [name, ok] of checks) console.log(`${ok?'PASS':'FAIL'} ${name}`);
process.exit(checks.every(([,ok])=>ok)?0:1);
