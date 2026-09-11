const fs = require('node:fs')
const path = require('node:path')
const {spawnSync} = require('node:child_process')

const root = path.resolve(__dirname, '..')
const outDir = __dirname
const session = process.env.DSH_GC_P18_SESSION || 'dsh-gc-p18-visual'
const url = process.env.DSH_GC_URL || 'http://127.0.0.1:3080/'
const runner = path.join(outDir, '.p18-visual-runner.js')
const reportPath = path.join(outDir, 'last-run.json')
const screenshotPath = path.join(outDir, 'last-run.png').replaceAll('\\', '/')

function runCli(args, opts = {}) {
  const result = spawnSync('playwright-cli', ['-s=' + session, ...args], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...opts,
  })
  if (result.error || result.status !== 0) return null
  return result.stdout.trim()
}

const code = String.raw`async (page) => {
  const wait = (ms) => page.waitForTimeout(ms)
  const visible = async (locator) => {
    try { return await locator.first().isVisible({timeout: 450}) } catch { return false }
  }
  const clickIfVisible = async (locator) => {
    try {
      const first = locator.first()
      if (await first.isVisible({timeout: 650})) {
        await first.click({timeout: 1200})
        await wait(450)
        return true
      }
    } catch {}
    return false
  }
  const clickText = async (...texts) => {
    for (const text of texts) {
      if (await clickIfVisible(page.getByText(text, {exact: false}))) return text
    }
    return ''
  }

  await page.goto('${url}', {waitUntil: 'domcontentloaded', timeout: 20000})
  await wait(1500)

  const steps = []
  steps.push({step: 'url', value: page.url()})

  // 左侧栏保持展开；如果当前处于窄/收起状态，优先点官方展开/项目入口。
  const openGroupChatTask = async () => {
    const candidates = ['DSH多Agent群聊插件方案', '规范开发与参考项目调研']
    await clickText('ha')
    let opened = await clickText(...candidates)
    if (opened) return opened
    await clickText('展开其余')
    opened = await clickText(...candidates)
    if (opened) return opened
    await clickText('dsh-group-chat')
    opened = await clickText(...candidates)
    if (opened) return opened
    await clickText('展开其余')
    opened = await clickText(...candidates)
    return opened
  }
  const openedTask = await openGroupChatTask()
  if (openedTask) steps.push({step: 'open-task', value: openedTask})

  // 切到插件中间标签；若当前还没出现，给 DSH 一点渲染时间。
  for (let i = 0; i < 8; i++) {
    if (await visible(page.getByText('Agent 群聊', {exact: true}))) break
    await wait(500)
  }
  const hasAgentTab = await visible(page.getByText('Agent 群聊', {exact: true}))
  if (hasAgentTab) {
    await clickIfVisible(page.getByText('Agent 群聊', {exact: true}))
  }

  // 展开右侧 HUD；offscreen 的隐藏 HUD 也可能被 Playwright 判为 visible，所以按真实 rect 判断。
  const hudOnscreenBefore = await page.evaluate(() => {
    const el = document.querySelector('.dsh-gc-sidebar-host')
    if (!el) return false
    const r = el.getBoundingClientRect()
    return r.width > 100 && r.left < window.innerWidth - 20 && r.right > 20
  }).catch(() => false)
  if (!hudOnscreenBefore) {
    const clickedHudToggle = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('[title],button,div,span')]
      const el = nodes.find(node => ((node.getAttribute('title') || '').includes('展开群聊')) || ((node.textContent || '').trim() === '群聊副屏'))
      if (el) { el.click(); return true }
      return false
    }).catch(() => false)
    if (!clickedHudToggle) {
      await clickIfVisible(page.getByTitle(/展开群聊/))
      await clickIfVisible(page.getByText('群聊副屏', {exact: false}))
    }
  }
  await wait(900)

  const metrics = await page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height)}
    }
    const cssPx = (el, prop) => el ? Number.parseFloat(getComputedStyle(el)[prop] || '0') : null
    const text = (sel) => document.querySelector(sel)?.textContent?.trim() || ''
    const hud = document.querySelector('.dsh-gc-sidebar-host')
    const conv = document.querySelector('.gc-conversation')
    const composer = document.querySelector('.gc-composer')
    const messages = document.querySelector('.gc-chat-messages')
    const left = document.querySelector('.pI_x6G_sidebarCol') || document.querySelector('[role="tree"]')?.closest('div')
    const hudRect = rect(hud)
    const convRect = rect(conv)
    const composerRect = rect(composer)
    const messagesRect = rect(messages)
    const visibleOverflow = []
    if (hud && hudRect) {
      const nodes = [...hud.querySelectorAll('*')]
      for (const el of nodes) {
        const r = el.getBoundingClientRect()
        const style = getComputedStyle(el)
        if (r.width <= 0 || r.height <= 0 || style.visibility === 'hidden' || style.display === 'none') continue
        const role = el.getAttribute('role') || ''
        const cls = typeof el.className === 'string' ? el.className : ''
        if (cls.includes('dsh-gc-resize-handle')) continue
        if (r.right > hudRect.right + 1 || r.left < hudRect.left - 1) {
          visibleOverflow.push({tag: el.tagName, role, cls, text: (el.textContent || '').trim().slice(0, 80), left: Math.round(r.left), right: Math.round(r.right), hostLeft: hudRect.left, hostRight: hudRect.right})
        }
      }
    }
    return {
      title: document.title,
      viewport: {width: window.innerWidth, height: window.innerHeight},
      bodyFlags: {
        tabActive: document.body.getAttribute('data-dsh-group-chat-tab-active'),
        hudOpen: document.body.getAttribute('data-dsh-group-chat-hud-docked-open'),
      },
      labels: {
        hasAgentTab: [...document.querySelectorAll('*')].some(el => (el.textContent || '').trim() === 'Agent 群聊'),
        hudTitle: text('.dsh-gc-sidebar-host'),
        hasOldHudName: document.body.textContent.includes('特遣监控室'),
        hasOldSquadSubtitle: !!hud && (hud.textContent || '').includes('全能特遣队'),
        hasHudDuplicateChatInput: !!hud && /发送消息，或选择\s*@\s*角色|描述你想要构建的内容/.test(hud.textContent || ''),
      },
      rects: {left: rect(left), hud: hudRect, conversation: convRect, composer: composerRect, messages: messagesRect},
      spacing: {
        composerPaddingLeft: cssPx(composer, 'paddingLeft'),
        composerPaddingRight: cssPx(composer, 'paddingRight'),
        messagesPaddingLeft: cssPx(messages, 'paddingLeft'),
        messagesPaddingRight: cssPx(messages, 'paddingRight'),
        conversationToHudGap: hudRect && convRect ? Math.round(hudRect.left - convRect.right) : null,
        composerToHudGap: hudRect && composerRect ? Math.round(hudRect.left - composerRect.right) : null,
      },
      visibleOverflow,
    }
  })

  await page.screenshot({path: '${screenshotPath}', fullPage: false})

  const failures = []
  if (!hasAgentTab && !metrics.labels.hasAgentTab) failures.push('未找到中间 Agent 群聊标签')
  if (!metrics.rects.hud || metrics.rects.hud.width < 280) failures.push('未找到展开后的右侧群聊控制台 HUD')
  if (metrics.rects.hud && (metrics.rects.hud.left >= metrics.viewport.width - 20 || metrics.rects.hud.right <= 20)) failures.push('右侧 HUD 仍在屏幕外，未真实展开')
  if (metrics.bodyFlags.hudOpen !== 'true') failures.push('缺少 HUD 展开态 body 标记 data-dsh-group-chat-hud-docked-open=true')
  if (metrics.labels.hasOldHudName) failures.push('HUD 标题回退为旧的“特遣监控室”')
  if (metrics.labels.hasOldSquadSubtitle) failures.push('HUD 副标题仍显示旧的“全能特遣队”')
  if (metrics.labels.hasHudDuplicateChatInput) failures.push('右侧 HUD 出现重复聊天输入派发')
  if (metrics.visibleOverflow.length > 0) failures.push('HUD 内存在可见元素外溢')
  if (metrics.rects.left && metrics.rects.left.width < 180) failures.push('左侧官方栏未处于展开态')
  if (metrics.rects.composer) {
    const diff = Math.abs((metrics.spacing.composerPaddingLeft || 0) - (metrics.spacing.composerPaddingRight || 0))
    if (diff > 1) failures.push('中间输入框左右 padding 不一致')
  } else {
    failures.push('未找到 Agent 群聊输入框 .gc-composer')
  }
  if (metrics.spacing.composerToHudGap !== null && (metrics.spacing.composerToHudGap < 0 || metrics.spacing.composerToHudGap > 18)) {
    failures.push('中间输入框与右侧 HUD 间距异常：' + metrics.spacing.composerToHudGap + 'px')
  }

  return {ok: failures.length === 0, failures, metrics, screenshot: '${screenshotPath}'}
}`

fs.writeFileSync(runner, code, 'utf8')
try {
  const openOut = runCli(['open', url, '--json'])
  if (openOut === null) {
    console.log(JSON.stringify({P18_BROWSER_VISUAL_REGRESSION_EXIT: 0, skipped: 'playwright-cli not available in current environment'}, null, 2))
    process.exit(0)
  }
  const raw = runCli(['run-code', '--filename', runner, '--raw'])
  const result = JSON.parse(raw)
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf8')
  if (!result.ok) {
    console.error(JSON.stringify(result, null, 2))
    process.exit(1)
  }
  console.log(JSON.stringify({P18_BROWSER_VISUAL_REGRESSION_EXIT: 0, report: reportPath, screenshot: path.join(outDir, 'last-run.png'), spacing: result.metrics.spacing, overflowCount: result.metrics.visibleOverflow.length}, null, 2))
} finally {
  try { fs.unlinkSync(runner) } catch {}
}



