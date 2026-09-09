const fs = require('fs');
const path = require('path');
const root = process.argv[2] || process.cwd();
const file = path.join(root, 'src/client/GroupChatSideDock.tsx');
const text = fs.readFileSync(file, 'utf8');
const checks = [
  ['approve endpoint uses workflow/action', text.includes("/dsh-group-chat/api/workflow/action")],
  ['approve payload sends action advance', text.includes("action: 'advance'") || text.includes('action: "advance"')],
  ['old workflow/advance endpoint absent', !text.includes('/dsh-group-chat/api/workflow/advance')],
];
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
