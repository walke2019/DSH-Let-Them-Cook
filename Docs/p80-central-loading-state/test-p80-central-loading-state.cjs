const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const panel = fs.readFileSync(path.join(root, 'src/client/GroupChatPanel.tsx'), 'utf8')

const checks = [
  ['room fetch has a 45s timeout abort guard', panel.includes('setTimeout(()=>{timedOut=true;controller.abort()},45000)')],
  ['loading is cleared even after fetch failure or timeout', panel.includes('finally(()=>{window.clearTimeout(timeout);if(active)setLoading(false)})')],
  ['empty state renders a central retryable error card', panel.includes('className="gc-load-error" role="alert"') && panel.includes('setRetry(v=>v+1)')],
  ['failed empty state auto-retries without requiring manual clicks', panel.includes('if(!error||!isEmptyState)return') && panel.includes('setTimeout(()=>setRetry(v=>v+1),5000)')],
  ['loading copy is locale aware', panel.includes("tx(locale,'正在加载…','Loading…')")],
  ['timeout guidance mentions auto retry and authenticated dsh web URL in zh and en', panel.includes('正在自动重试') && panel.includes('will auto-retry') && panel.includes('重新打开 dsh web 打印的认证链接') && panel.includes('reopen the authenticated URL printed by dsh web')],
  ['cleanup cancels timeout and disables stale state writes', panel.includes('active=false;window.clearTimeout(timeout);controller.abort();unsubscribe()')],
  ['bottom error is suppressed while central empty-state error is visible', panel.includes('error&&!isEmptyState&&<div className="gc-chat-error"')],
]

const failed = checks.filter(([, ok]) => !ok)
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`)
if (failed.length) process.exit(1)
console.log('P80_CENTRAL_LOADING_STATE_EXIT:0')
