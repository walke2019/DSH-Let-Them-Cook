const fs = require('fs');
const path = require('path');
const root = process.argv[2] || '.';
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const client = read('src/client/GroupChatSideDock.tsx');
const host = read('src/index.ts');
const checks = [
  ['theme select has default label', client.includes('默认（沙雕整活）')],
  ['mode select has default label', client.includes('默认（工作流）')],
  ['theme default resolves to meme_comedy', host.includes("rawTheme === 'default' ? 'meme_comedy' : rawTheme")],
  ['mode default resolves to workflow_driven', host.includes("rawMode === 'default' ? 'workflow_driven' : rawMode")],
  ['selected current defaults display as default', client.includes("selectedTheme = room?.activeTheme === 'meme_comedy' ? 'default'") && client.includes("selectedMode = room?.dispatchMode === 'workflow_driven' ? 'default'" )],
];
for (const [name, ok] of checks) console.log(`${ok?'PASS':'FAIL'} ${name}`);
process.exit(checks.every(([,ok])=>ok)?0:1);
