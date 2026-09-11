const fs = require('fs');
const path = require('path');

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const tab = read('src/client/GroupChatConversationTab.tsx');
const index = read('src/client/index.ts');
const pkg = JSON.parse(read('package.json'));
const doc = read('docs/tasks/phases/p44-source-dialog-prepare-diagnostic/README.md');

assert(/prepare:\s*\(\)\s*=>\s*\(\{\}\)/.test(tab), 'GroupChatConversationView must expose prepare()');
assert(/prepare:\s*GroupChatConversationView\.prepare/.test(index), 'conversation.view injection must pass prepare');
assert(pkg.peerDependencies && pkg.peerDependencies['@deepseek-ai/dsh-tools'], 'dsh-tools must stay peerDependency');
assert(!(pkg.dependencies && pkg.dependencies['@deepseek-ai/dsh-tools']), 'dsh-tools must not be bundled dependency');
assert(doc.includes('ctx.tools[TOOL_RUNTIME_SCHEDULER].prepare(call.exec)'), 'diagnostic doc must record backend prepare callsite');
assert(doc.includes('@deepseek-ai/dsh-tools') && doc.includes('Symbol'), 'diagnostic doc must record dsh-tools Symbol mismatch risk');

const globalBase = path.join(process.env.APPDATA || '', 'npm', 'node_modules', '@deepseek-ai');
let toolCopies = [];
function walk(dir) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.') || dir.includes(`${path.sep}node_modules${path.sep}`)) {
        const pkgPath = path.join(p, '@deepseek-ai', 'dsh-tools', 'package.json');
        if (fs.existsSync(pkgPath)) toolCopies.push(pkgPath);
      }
      if (!p.includes(`${path.sep}.cache${path.sep}`)) walk(p);
    }
  }
}
const isWindows = process.platform === 'win32';
const agentLoopCandidates = [];
function findAgentLoop(dir) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) findAgentLoop(p);
    else if (entry.name === 'index.js') {
      try {
        const s = fs.readFileSync(p, 'utf8');
        if (s.includes('ctx.tools[TOOL_RUNTIME_SCHEDULER].prepare(call.exec)')) agentLoopCandidates.push(p);
      } catch {}
    }
  }
}

if (isWindows && globalBase && fs.existsSync(globalBase)) {
  walk(globalBase);
  findAgentLoop(globalBase);
  assert(agentLoopCandidates.length > 0, 'DSH agent-loop backend prepare callsite not found');
  assert(toolCopies.length > 1, 'Expected multiple global dsh-tools copies for current diagnostic environment');
}

console.log(JSON.stringify({
  P44_SOURCE_DIALOG_PREPARE_DIAGNOSTIC_EXIT: 0,
  frontendConversationPrepare: true,
  dshToolsDependencyMode: 'peerDependency',
  backendPrepareCallsites: agentLoopCandidates.length,
  globalDshToolsCopies: toolCopies.length,
  environment: process.platform,
  likelyCause: 'backend-tool-runtime-scheduler-undefined-or-dsh-tools-symbol-mismatch',
  directGroupChatCause: false
}, null, 2));
