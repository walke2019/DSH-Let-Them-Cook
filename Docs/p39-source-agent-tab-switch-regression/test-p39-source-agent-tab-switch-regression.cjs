const fs = require('node:fs')
const path = require('node:path')
const {spawnSync} = require('node:child_process')

const root = path.resolve(__dirname, '../..')
const session = process.env.DSH_GC_P39_SESSION || 'dsh-gc-p39-source-agent-switch'
const url = process.env.DSH_GC_URL || 'http://127.0.0.1:3080/'
const runner = path.join(__dirname, '.p39-runner.js')
const reportPath = path.join(__dirname, 'last-run.json')

function runCli(args) {
  const result = spawnSync('playwright-cli', ['-s=' + session, ...args], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) throw new Error(`playwright-cli ${args.join(' ')} failed ${result.status}\n${result.stdout}\n${result.stderr}`)
  return result.stdout.trim()
}

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
      hasAgentTabLabel: text.includes('Agent 群聊'),
      hasHudTabs: ['团队', '工作流', '黑板', '账本'].every(label => text.includes(label)),
      hasOfficialDialogLabel: text.includes('对话'),
      bodyFlags: {
        tabActive: document.body.getAttribute('data-dsh-group-chat-tab-active'),
        hudOpen: document.body.getAttribute('data-dsh-group-chat-hud-docked-open'),
      },
    }
  })

  await page.goto('${url}', {waitUntil: 'domcontentloaded', timeout: 20000})
  await wait(1500)

  await clickVisibleText('新会话')
  await wait(900)
  const officialBefore = await snapshot()

  await clickSidebarConversation('DSH多Agent群聊插件方案')
  for (let i = 0; i < 12; i++) {
    const s = await snapshot()
    if (s.hasAgentTabLabel) break
    await wait(500)
  }
  await clickVisibleText('Agent 群聊')
  await wait(900)
  const agentChat = await snapshot()

  await clickVisibleText('对话')
  await wait(900)
  const officialAfter = await snapshot()

  const failures = []
  if (!officialBefore.hasOfficialComposer) failures.push('源版新会话没有找到官方 composer')
  if (officialBefore.hasHud) failures.push('源版新会话出现群聊 HUD')
  if (officialBefore.hasGcConversationTab) failures.push('源版新会话出现群聊中间视图')
  if (officialBefore.bodyFlags.tabActive || officialBefore.bodyFlags.hudOpen) failures.push('源版新会话残留扩展 body 标记')

  if (!agentChat.hasGcConversationTab) failures.push('Agent 群聊标签未渲染中间群聊视图')
  if (!agentChat.hasHud) failures.push('Agent 群聊标签未渲染 HUD')
  if (agentChat.bodyFlags.tabActive !== 'true') failures.push('Agent 群聊标签未写入 tabActive=true')
  if (!agentChat.hasHudTabs) failures.push('Agent 群聊 HUD 缺少团队/工作流/黑板/账本标签')

  if (!officialAfter.hasOfficialDialogLabel) failures.push('切回源版对话后没有官方对话标签')
  if (officialAfter.hasHud) failures.push('切回源版对话后 HUD 未卸载')
  if (officialAfter.hasGcConversationTab) failures.push('切回源版对话后群聊中间视图未卸载')
  if (officialAfter.bodyFlags.tabActive || officialAfter.bodyFlags.hudOpen) failures.push('切回源版对话后扩展 body 标记未清理')
  const badErrors = errors.filter(e => /prepare|unscoped context|Cannot read properties of undefined|resume failed/i.test(e))
  if (badErrors.length) failures.push('浏览器控制台存在历史关键错误：' + badErrors.slice(0, 3).join(' | '))

  return {ok: failures.length === 0, failures, officialBefore, agentChat, officialAfter, errors}
}`

fs.writeFileSync(runner, code, 'utf8')
try {
  runCli(['open', url, '--json'])
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

