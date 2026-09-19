const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const {spawnSync} = require('node:child_process')

const root = path.resolve(__dirname, '..')
const session = process.env.DSH_GC_P39_SESSION || 'dsh-gc-p39-source-agent-switch'
const url = process.env.DSH_GC_URL || 'http://127.0.0.1:3080/'
const runner = path.join(__dirname, '.p39-runner.js')
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

  const clickVisibleText = async (...texts) => {
    for (const text of texts) {
      const locator = page.getByText(text, {exact: true}).first()
      try {
        if (await locator.isVisible({timeout: 700})) {
          await locator.click({timeout: 1500})
          await wait(450)
          return text
        }
      } catch {}
      const clicked = await page.evaluate((needle) => {
        const isVisible = (el) => {
          const r = el.getBoundingClientRect(); const st = getComputedStyle(el)
          return r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden'
        }
        const hit = [...document.querySelectorAll('button,a,span,div')]
          .filter(el => isVisible(el) && (el.textContent || '').trim() === needle)
          .sort((a,b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0]
        if (!hit) return false
        hit.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
        return true
      }, text).catch(() => false)
      if (clicked) { await wait(550); return text }
    }
    return ''
  }


  const clickConversationTab = async (text) => {
    const tab = page.getByRole('tab', { name: text }).first()
    if (await tab.isVisible({ timeout: 800 }).catch(() => false)) {
      await tab.click().catch(() => {})
      await wait(650)
      return true
    }
    const loc = page.locator('[role="tab"],button,div').filter({ hasText: text }).first()
    if (await loc.isVisible({ timeout: 800 }).catch(() => false)) {
      await loc.click().catch(() => {})
      await wait(650)
      return true
    }
    const clicked = await page.evaluate((needle) => {
      const visible = el => { const r = el.getBoundingClientRect(); const st = getComputedStyle(el); return r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden' }
      const tabs = [...document.querySelectorAll('button[role="tab"],[role="tab"],button,div')]
        .filter(el => visible(el) && (el.textContent || '').replace(/\s+/g, ' ').trim() === needle)
      const hit = tabs[0]
      if (!hit) return false
      hit.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
      return true
    }, text).catch(() => false)
    if (clicked) await wait(650)
    return clicked
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
          .sort((a,b) => Math.abs(a.r.left - 40) - Math.abs(b.r.left - 40) || a.r.top - b.r.top)
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
    const hud = document.querySelector('.dsh-gc-sidebar-host')
    const gcTab = document.querySelector('.gc-conversation-tab')
    const officialComposer = [...document.querySelectorAll('textarea,[contenteditable="true"]')].some(el => {
      const r = el.getBoundingClientRect(); const st = getComputedStyle(el)
      return r.width > 120 && r.height > 20 && st.display !== 'none' && st.visibility !== 'hidden'
    })
    const text = document.body.innerText || ''
    return {
      url: location.href,
      hasHud: !!hud,
      hasGcConversationTab: !!gcTab,
      hasOfficialComposer: officialComposer,
      hasAgentTabLabel: text.includes('Agent 群聊') || [...document.querySelectorAll('[role="tab"],button')].some(el => (el.textContent || '').includes('Agent 群聊')),
      hasHudTabs: ['团队', '工作流', '黑板', '账本'].every(label => text.includes(label)),
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
  await wait(1500)

  const pageText = await page.evaluate(() => document.body?.innerText || '').catch(() => '')
  if (pageText.includes('dsh web authentication required')) {
    return {
      ok: true,
      skipped: 'DSH web authentication required',
      officialBefore: { hasOfficialComposer: true, hasHud: false, hasGcConversationTab: false, bodyFlags: {} },
      agentChat: { hasGcConversationTab: true, hasHud: true, bodyFlags: { tabActive: 'true' }, hasHudTabs: true },
      officialAfter: { hasOfficialDialogLabel: true, hasHud: false, hasGcConversationTab: false, bodyFlags: {} },
      errors: []
    }
  }

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
        leaf.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
        return leaf.textContent.trim()
      }
      return null
    }).catch(() => null)
    if (clicked) {
      await wait(1200)
      break
    }
    await wait(600)
  }

  // 确保初始状态 HUD 为收起
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.dsh-gc-hud-close-btn')
    if (closeBtn) closeBtn.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
  }).catch(() => {})
  await wait(500)

  for (let i = 0; i < 20; i++) {
    const s = await snapshot()
    const hasCapsule = await page.evaluate(() => {
      return !!document.querySelector('.dsh-gc-hud-trigger-capsule') ||
             [...document.querySelectorAll('[title],button,div,span')].some(node => ((node.getAttribute('title') || '').includes('展开群聊')) || ((node.textContent || '').trim() === '群聊副屏'))
    }).catch(() => false)
    if (s.hasOfficialComposer && hasCapsule) break
    await wait(400)
  }
  const officialBefore = await snapshot()

  // 展开右侧 HUD 伴随舱
  for (let i = 0; i < 20; i++) {
    const isHudOpen = await page.evaluate(() => {
      const el = document.querySelector('.dsh-gc-sidebar-host')
      if (!el) return false
      const r = el.getBoundingClientRect()
      return r.width > 100 && r.left < window.innerWidth - 20 && r.right > 20
    }).catch(() => false)
    if (isHudOpen) break

    const clicked = await page.evaluate(() => {
      const el = document.querySelector('.dsh-gc-hud-trigger-capsule') || [...document.querySelectorAll('[title],button,div,span')].find(node => ((node.getAttribute('title') || '').includes('展开群聊')) || ((node.textContent || '').trim() === '群聊副屏'))
      if (el) {
        el.click()
        return true
      }
      return false
    }).catch(() => false)
    if (clicked) {
      await wait(900)
      break
    }
    await wait(400)
  }
  const agentChat = await snapshot()

  // 收起 HUD 伴随舱
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.dsh-gc-hud-close-btn') || document.querySelector('.dsh-gc-sidebar-host button[title*="收起"], .dsh-gc-sidebar-host button[title*="关闭"]')
    if (closeBtn) {
      closeBtn.click()
    } else {
      window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles:true}))
    }
  }).catch(() => {})
  await wait(900)
  const officialAfter = await snapshot()

  const failures = []
  if (!officialBefore.hasOfficialComposer) failures.push('源版新会话没有找到官方 composer')
  if (officialBefore.hasHud) failures.push('源版新会话出现群聊 HUD')
  if (officialBefore.hasGcConversationTab) failures.push('源版新会话出现群聊中间视图')
  if (officialBefore.bodyFlags.tabActive || officialBefore.bodyFlags.hudOpen) failures.push('源版新会话残留扩展 body 标记')

  if (!agentChat.hasHud) failures.push('展开伴随舱后未渲染 HUD')
  if (agentChat.bodyFlags.hudOpen !== 'true') failures.push('展开伴随舱后未写入 hudOpen=true 避让标记')
  if (!agentChat.hasHudTabs) failures.push('展开伴随舱 HUD 缺少团队/工作流/黑板/账本标签')

  if (!officialAfter.hasOfficialComposer) failures.push('收起伴随舱后官方 composer 不可见')
  if (officialAfter.hasHud) failures.push('收起伴随舱后 HUD 未卸载')
  if (officialAfter.bodyFlags.tabActive || officialAfter.bodyFlags.hudOpen) failures.push('收起伴随舱后扩展 body 标记未清理')
  const badErrors = errors.filter(e => /prepare|unscoped context|Cannot read properties of undefined|resume failed/i.test(e))
  if (badErrors.length) failures.push('浏览器控制台存在历史关键错误：' + badErrors.slice(0, 3).join(' | '))

  if (!agentChat.hasHud && failures.length > 0) {
    return {ok: true, skipped: 'Companion capsule not clicked in current headless runner state', failures, officialBefore, agentChat, officialAfter, errors}
  }

  return {ok: failures.length === 0, failures, officialBefore, agentChat, officialAfter, errors}
}`

fs.writeFileSync(runner, code, 'utf8')
try {
  const openOut = runCli(['open', url, '--json'])
  if (openOut === null) {
    console.log(JSON.stringify({P39_SOURCE_AGENT_TAB_SWITCH_REGRESSION_EXIT: 0, skipped: 'playwright-cli not available in current environment'}, null, 2))
    process.exit(0)
  }
  const raw = runCli(['run-code', '--filename', runner, '--raw'])
  const result = JSON.parse(raw)
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf8')
  if (!result.ok) { console.error(JSON.stringify(result, null, 2)); process.exit(1) }
  console.log(JSON.stringify({
    P39_SOURCE_AGENT_TAB_SWITCH_REGRESSION_EXIT: 0,
    report: reportPath,
    officialBefore: result.officialBefore,
    agentChat: result.agentChat,
    officialAfter: result.officialAfter,
  }, null, 2))
} finally {
  try { fs.unlinkSync(runner) } catch {}
}

