const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const {spawnSync} = require('node:child_process')

const root = path.resolve(__dirname, '..')
const session = process.env.DSH_GC_P42_SESSION || 'dsh-gc-p42-agent-entry-usable'
const url = process.env.DSH_GC_URL || 'http://127.0.0.1:3080/'
const runner = path.join(__dirname, '.p42-runner.js')
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
          await wait(450)
          return text
        }
      } catch {}
      const clicked = await page.evaluate((needle) => {
        const visible = el => {
          const r = el.getBoundingClientRect(); const st = getComputedStyle(el)
          return r.width > 0 && r.height > 0 && r.left < innerWidth && r.right > 0 && st.display !== 'none' && st.visibility !== 'hidden'
        }
        const hit = [...document.querySelectorAll('button,a,span,div')]
          .filter(el => visible(el) && (el.textContent || '').trim().includes(needle))
          .sort((a,b) => ((a.getAttribute('role') === 'treeitem' ? 0 : 1) - (b.getAttribute('role') === 'treeitem' ? 0 : 1)) || a.getBoundingClientRect().height - b.getBoundingClientRect().height || a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0]
        hit.dispatchEvent(new MouseEvent('mousedown', {bubbles:true, cancelable:true, view:window}))
        hit.dispatchEvent(new MouseEvent('mouseup', {bubbles:true, cancelable:true, view:window}))
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
        const treeitems = [...document.querySelectorAll('[role="treeitem"]')]
        for (const item of treeitems) {
          if (item.getAttribute('aria-expanded') === 'false') {
            const chevron = item.querySelector('.YDXeBa_chevron, svg, [class*="chevron"], [class*="arrow"]') || item.firstElementChild
            if (chevron) chevron.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
          }
        }
        const leaf = treeitems.find(el => {
          const text = (el.textContent || '').trim()
          const isFolder = el.hasAttribute('aria-expanded')
          return !isFolder && text !== '新会话' && text.length > 0
        })
        if (leaf) {
          leaf.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
          return leaf.textContent.trim()
        }
        return false
      }).catch(()=>false)
      if (clicked) { await wait(1200); return 'session-opened' }
      await wait(500)
    }
    return ''
  }

  const cookie = ${JSON.stringify(authCookie)}
  if (cookie) {
    try { await page.context().addCookies([cookie]) } catch {}
  }
  await page.goto('${url}', {waitUntil: 'domcontentloaded', timeout: 20000})
  let opened = ''
  for (let attempt = 0; attempt < 10; attempt++) {
    const clicked = await page.evaluate(() => {
      const treeitems = [...document.querySelectorAll('[role="treeitem"]')]
      for (const item of treeitems) {
        if (item.getAttribute('aria-expanded') === 'false') {
          const chevron = item.querySelector('.YDXeBa_chevron, svg, [class*="chevron"], [class*="arrow"]') || item.firstElementChild
          if (chevron) chevron.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
        }
      }
      const leaf = treeitems.find(el => {
        const text = (el.textContent || '').trim()
        const isFolder = el.hasAttribute('aria-expanded')
        return !isFolder && text !== '新会话' && text.length > 0
      })
      if (leaf) {
        leaf.dispatchEvent(new MouseEvent('mousedown', {bubbles:true, cancelable:true, view:window}))
        leaf.dispatchEvent(new MouseEvent('mouseup', {bubbles:true, cancelable:true, view:window}))
        leaf.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
        return leaf.textContent.trim()
      }
      return null
    }).catch(() => null)
    if (clicked) {
      opened = clicked
      await wait(1200)
      break
    }
    await wait(600)
  }
  for (let i = 0; i < 12; i++) {
    const tabLoc = page.getByRole('tab', { name: 'Agent 群聊' }).first()
    if (await tabLoc.isVisible().catch(() => false)) {
      await tabLoc.click().catch(() => {})
      break
    }
    const has = await page.getByText('Agent 群聊', {exact:false}).first().isVisible().catch(()=>false)
    if (has) {
      await page.getByText('Agent 群聊', {exact:false}).first().click().catch(() => {})
      break
    }
    await wait(500)
  }
  await wait(900)
  const hudOnscreenBefore = await page.evaluate(() => { const el = document.querySelector('.dsh-gc-sidebar-host'); if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 100 && r.left < innerWidth - 20 && r.right > 20 })
  if (!hudOnscreenBefore) await clickText('群聊副屏')
  await wait(600)
  await page.evaluate(() => { const tab = document.querySelector('.dsh-gc-sidebar-host [data-dsh-gc-hud-tab="workflow"]'); if (tab) tab.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window})) })
  await wait(500)

  const result = await page.evaluate(() => {
    const rect = el => { const r = el?.getBoundingClientRect?.(); return r ? {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height} : null }
    const visible = el => {
      if (!el) return false
      const r = el.getBoundingClientRect(); const st = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && r.left < innerWidth && r.right > 0 && st.display !== 'none' && st.visibility !== 'hidden'
    }
    const hud = document.querySelector('.dsh-gc-sidebar-host')
    const conv = document.querySelector('.gc-conversation-tab')
    const composer = document.querySelector('.gc-composer')
    const text = document.body.innerText || ''
    const hudText = hud?.innerText || ''
    const convText = conv?.innerText || ''
    const overflow = []
    const hudRect = rect(hud)
    if (hud && hudRect) {
      for (const el of [...hud.querySelectorAll('*')]) {
        if (!visible(el)) continue
        const cls = typeof el.className === 'string' ? el.className : ''
        if (cls.includes('dsh-gc-resize-handle')) continue
        const r = el.getBoundingClientRect()
        if (r.left < hudRect.left - 1 || r.right > hudRect.right + 1) overflow.push({text:(el.textContent||el.tagName).trim().slice(0,80), left:r.left, right:r.right})
      }
    }
    return {
      openedBodyText: text.slice(0, 1000),
      hasConversation: !!conv && visible(conv),
      hasComposer: !!composer && visible(composer),
      hasHud: !!hud && visible(hud),
      hasFriendlyEntry: /把活儿丢进群|AI 小队开整|发送消息|选择 @ 角色|快活|群聊|Toss in the work|AI crew|Send a message|Group chat/i.test(convText),
      hasExistingConversation: /人类负责人|模型调用失败|调用失败|@离谱总导演|@[a-z][\w-]*|复制|当前任务|Human lead|Model call|failed|task/i.test(convText),
      hasHudTabs: ['团队','工作流','黑板','账本'].every(label => hudText.includes(label) || text.includes(label)),
      hasCompactWorkflow: /当前阶段|当前任务|高级详情|执行导演台/.test(hudText),
      hasOldLabels: text.includes('特遣协同') || text.includes('特遣监控室'),
      bodyFlags: {
        tabActive: document.body.getAttribute('data-dsh-group-chat-tab-active'),
        hudOpen: document.body.getAttribute('data-dsh-group-chat-hud-docked-open'),
      },
      rects: {hud: hudRect, conversation: rect(conv), composer: rect(composer)},
      overflow,
    }
  })

  const badErrors = errors.filter(e => /prepare|unscoped context|Cannot read properties of undefined|resume failed/i.test(e))
  const failures = []
  if (!opened) failures.push('没有打开承载扩展的任务')
  if (!result.hasConversation) failures.push('Agent 群聊中间视图不可见')
  if (!result.hasComposer) failures.push('Agent 群聊输入框不可见')
  if (!result.hasFriendlyEntry && !result.hasExistingConversation) failures.push('Agent 群聊缺少低理解成本入口文案或既有消息记录')
  if (!result.hasHud) failures.push('群聊控制台 HUD 不在屏幕内可见')
  if (!result.hasHudTabs) failures.push('HUD 缺少团队/工作流/黑板/账本标签')
  if (!result.hasCompactWorkflow) failures.push('HUD 缺少清爽工作流概览')
  if (result.hasOldLabels) failures.push('出现旧标签“特遣协同/特遣监控室”')
  if (result.bodyFlags.tabActive !== 'true') failures.push('Agent 群聊激活后 body tabActive 不是 true')
  if (result.overflow.length) failures.push('HUD 存在可见横向溢出')
  if (badErrors.length) failures.push('出现历史关键错误：' + badErrors.join(' | '))

  return {ok: failures.length === 0, failures, result, errors}
}`

fs.writeFileSync(runner, code, 'utf8')
try {
  const openOut = runCli(['open', url, '--json'])
  if (openOut === null) {
    console.log(JSON.stringify({P42_AGENT_CHAT_ENTRY_USABLE_REGRESSION_EXIT: 0, skipped: 'playwright-cli not available in current environment'}, null, 2))
    process.exit(0)
  }
  const raw = runCli(['run-code', '--filename', runner, '--raw'])
  const result = JSON.parse(raw)
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf8')
  if (!result.ok) { console.error(JSON.stringify(result, null, 2)); process.exit(1) }
  console.log(JSON.stringify({
    P42_AGENT_CHAT_ENTRY_USABLE_REGRESSION_EXIT: 0,
    report: reportPath,
    hasConversation: result.result.hasConversation,
    hasComposer: result.result.hasComposer,
    hasHud: result.result.hasHud,
    hasHudTabs: result.result.hasHudTabs,
    overflowCount: result.result.overflow.length,
  }, null, 2))
} finally {
  try { fs.unlinkSync(runner) } catch {}
}


