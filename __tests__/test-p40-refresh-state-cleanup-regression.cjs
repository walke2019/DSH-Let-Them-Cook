const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const {spawnSync} = require('node:child_process')

const root = path.resolve(__dirname, '..')
const session = process.env.DSH_GC_P40_SESSION || 'dsh-gc-p40-refresh-cleanup'
const url = process.env.DSH_GC_URL || 'http://127.0.0.1:3080/'
const runner = path.join(__dirname, '.p40-runner.js')
const reportPath = path.join(__dirname, 'last-run.json')

function getAuthCookie(targetUrl) {
  try {
    const credPath = path.join(process.env.USERPROFILE || '', '.dsh', '.credentials.yaml')
    if (!fs.existsSync(credPath)) return null
    const yaml = fs.readFileSync(credPath, 'utf8')
    const m = yaml.match(/secret:\s*([^\s]+)/)
    if (!m) return null
    const secretBase64 = m[1]
    const padding = '='.repeat((4 - secretBase64.length % 4) % 4)
    const secret = Buffer.from(secretBase64.replaceAll('-', '+').replaceAll('_', '/') + padding, 'base64')
    const u = new URL(targetUrl)
    const authority = u.host
    const encodeBase64Url = buf => Buffer.from(buf).toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '')
    const cName = 'dsh-auth-' + encodeBase64Url(crypto.createHash('sha256').update(authority).digest())
    const issuedAt = Date.now()
    const expiresAt = issuedAt + 24 * 60 * 60 * 1000
    const payload = { version: 1, authority, issuedAt, expiresAt }
    const body = encodeBase64Url(Buffer.from(JSON.stringify(payload), 'utf8'))
    const sig = encodeBase64Url(crypto.createHmac('sha256', secret).update(body).digest())
    const val = 'v1.' + body + '.' + sig
    return { name: cName, value: val, domain: u.hostname, path: '/' }
  } catch (e) {
    return null
  }
}

function runCli(args) {
  const result = spawnSync('playwright-cli', ['-s=' + session, ...args], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  if (result.error || result.status !== 0) return null
  return result.stdout.trim()
}

const authCookie = getAuthCookie(url)
const code = String.raw`async (page) => {
  const wait = ms => page.waitForTimeout(ms)
  const errors = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('pageerror', err => errors.push(err.message || String(err)))

  const clickText = async (...texts) => {
    for (const text of texts) {
      try {
        const loc = page.getByText(text, {exact: false}).first()
        if (await loc.isVisible({timeout: 700})) {
          await loc.click({timeout: 1500})
          await wait(500)
          return text
        }
      } catch {}
      const clicked = await page.evaluate((needle) => {
        const visible = el => {
          const r = el.getBoundingClientRect(); const st = getComputedStyle(el)
          return r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden'
        }
        const hit = [...document.querySelectorAll('button,a,span,div')]
          .filter(el => visible(el) && (el.textContent || '').trim().includes(needle))
          .sort((a,b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0]
        if (!hit) return false
        hit.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
        return true
      }, text).catch(() => false)
      if (clicked) { await wait(550); return text }
    }
    return ''
  }

  const openGroupChatTask = async () => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const clicked = await page.evaluate(() => {
        const visible = el => {
          const r = el.getBoundingClientRect()
          const st = getComputedStyle(el)
          return r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden'
        }
        const treeitems = [...document.querySelectorAll('[role="treeitem"]')].filter(el => visible(el))
        const session = treeitems.find(el => {
          const text = (el.textContent || '').trim()
          const isSession = (el.className || '').includes('sessionRow') || el.getAttribute('aria-expanded') === null
          return isSession && text !== '新会话' && text.length > 0
        })
        if (session) {
          session.dispatchEvent(new MouseEvent('mousedown', {bubbles:true, cancelable:true, view:window}))
          session.dispatchEvent(new MouseEvent('mouseup', {bubbles:true, cancelable:true, view:window}))
          session.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
          return session.textContent.trim()
        }
        const folders = treeitems.filter(el => (el.className || '').includes('projectRow') || ['dsh-group-chat', 'ha'].some(n => (el.textContent || '').includes(n)))
        for (const folder of folders) {
          const chevron = folder.querySelector('.YDXeBa_chevron, svg, [class*="chevron"], [class*="arrow"]') || folder.firstElementChild
          if (chevron) {
            chevron.dispatchEvent(new MouseEvent('mousedown', {bubbles:true, cancelable:true, view:window}))
            chevron.dispatchEvent(new MouseEvent('mouseup', {bubbles:true, cancelable:true, view:window}))
            chevron.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
          }
        }
        return false
      }).catch(() => false)
      if (clicked) { await wait(1200); return true }
      await wait(600)
    }
    return false
  }
  const clickSidebarConversation = async (...texts) => {
    for (const text of texts) {
      const clicked = await page.evaluate((needle) => {
        const visible = el => {
          const r = el.getBoundingClientRect(); const st = getComputedStyle(el)
          return r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden'
        }
        const candidates = [...document.querySelectorAll('button,a,span,div')]
          .filter(el => visible(el) && (el.textContent || '').trim().includes(needle))
          .map(el => ({el, r: el.getBoundingClientRect(), text: (el.textContent || '').trim()}))
          .filter(x => x.r.left < 330 && x.r.top > 60 && x.r.height < 90 && x.text.length <= 80)
          .sort((a,b) => ((a.el.getAttribute('role') === 'treeitem' ? 0 : 1) - (b.el.getAttribute('role') === 'treeitem' ? 0 : 1)) || Math.abs(a.r.left - 40) - Math.abs(b.r.left - 40) || a.r.top - b.r.top)
        const hit = candidates[0]?.el
        if (!hit) return false
        hit.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
        return true
      }, text).catch(() => false)
      if (clicked) { await wait(900); return text }
    }
    return ''
  }

  const snapshot = () => page.evaluate(() => {
    const visibleRect = el => {
      if (!el) return false
      const r = el.getBoundingClientRect(); const st = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden'
    }
    const text = document.body.innerText || ''
    const hud = document.querySelector('.dsh-gc-sidebar-host')
    const gcTab = document.querySelector('.gc-conversation-tab')
    const composer = [...document.querySelectorAll('textarea,[contenteditable="true"]')].some(visibleRect)
    return {
      hasHud: !!hud,
      hudVisible: visibleRect(hud),
      hasGcConversationTab: !!gcTab,
      gcTabVisible: visibleRect(gcTab),
      hasComposer: composer,
      hasAgentLabel: text.includes('Agent 群聊'),
      hasOfficialDialogLabel: text.includes('对话'),
      bodyFlags: {
        tabActive: document.body.getAttribute('data-dsh-group-chat-tab-active'),
        hudOpen: document.body.getAttribute('data-dsh-group-chat-hud-docked-open'),
      },
    }
  })

  const cookie = ${JSON.stringify(authCookie)}
  if (cookie) {
    try { await page.context().addCookies([cookie]) } catch {}
  }
  await page.goto('${url}', {waitUntil: 'domcontentloaded', timeout: 20000})
  await wait(1400)
  await openGroupChatTask()
  for (let i = 0; i < 12; i++) { if ((await snapshot()).hasAgentLabel) break; await wait(500) }
  await clickText('Agent 群聊')
  await wait(800)
  const beforeReload = await snapshot()

  await page.reload({waitUntil: 'domcontentloaded', timeout: 20000})
  await wait(2000)
  await clickText('新会话')
  await wait(1200)
  for (let i = 0; i < 8; i++) {
    const s = await snapshot()
    if (s.hasComposer) break
    await wait(400)
  }
  const afterReloadNewChat = await snapshot()

  await openGroupChatTask()
  for (let i = 0; i < 12; i++) { if ((await snapshot()).hasAgentLabel) break; await wait(500) }
  await clickText('Agent 群聊')
  await wait(900)
  const afterReturnAgent = await snapshot()

  const badErrors = errors.filter(e => /prepare|unscoped context|Cannot read properties of undefined|resume failed/i.test(e))
  const failures = []
  if (!beforeReload.hasHud || !beforeReload.hasGcConversationTab) failures.push('刷新前 Agent 群聊/HUD 未进入可验证状态')
  if (!afterReloadNewChat.hasComposer) failures.push('刷新后新会话官方 composer 不存在')
  if (afterReloadNewChat.hasHud) failures.push('刷新后新会话残留 HUD')
  if (afterReloadNewChat.hasGcConversationTab) failures.push('刷新后新会话残留 Agent 群聊视图')
  if (afterReloadNewChat.bodyFlags.tabActive || afterReloadNewChat.bodyFlags.hudOpen) failures.push('刷新后新会话残留扩展 body 标记')
  if (!afterReturnAgent.hasHud || !afterReturnAgent.hasGcConversationTab) failures.push('刷新后返回 Agent 群聊未恢复 HUD/中间视图')
  if (afterReturnAgent.bodyFlags.tabActive !== 'true') failures.push('刷新后返回 Agent 群聊未恢复 tabActive=true')
  if (badErrors.length) failures.push('出现历史回归错误：' + badErrors.join(' | '))

  return {ok: failures.length === 0, failures, beforeReload, afterReloadNewChat, afterReturnAgent, errors}
}`

fs.writeFileSync(runner, code, 'utf8')
try {
  const openOut = runCli(['open', url, '--json'])
  if (openOut === null) {
    console.log(JSON.stringify({P40_REFRESH_STATE_CLEANUP_REGRESSION_EXIT: 0, skipped: 'playwright-cli not available in current environment'}, null, 2))
    process.exit(0)
  }
  const raw = runCli(['run-code', '--filename', runner, '--raw'])
  const result = JSON.parse(raw)
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf8')
  if (!result.ok) { console.error(JSON.stringify(result, null, 2)); process.exit(1) }
  console.log(JSON.stringify({
    P40_REFRESH_STATE_CLEANUP_REGRESSION_EXIT: 0,
    report: reportPath,
    afterReloadNewChat: result.afterReloadNewChat,
    afterReturnAgent: result.afterReturnAgent,
    errorCount: result.errors.length,
  }, null, 2))
} finally {
  try { fs.unlinkSync(runner) } catch {}
}


