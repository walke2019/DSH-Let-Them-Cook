#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const base = path.join(root, 'Docs/full-small-task-test/original');
const pairs = [
  ['src/client/GroupChatSideDock.tsx', 'src/client/GroupChatSideDock.tsx'],
  ['lib/client.js', 'lib/client.js'],
  ['lib/client.js.map', 'lib/client.js.map'],
];
for (const [from, to] of pairs) {
  const src = path.join(base, from);
  const dst = path.join(root, to);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}
console.log('ROLLBACK_OK restored GroupChatSideDock.tsx, lib/client.js, lib/client.js.map');
