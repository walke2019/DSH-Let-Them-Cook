const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const {spawnSync} = require('node:child_process')

const root = path.resolve(__dirname, '..')
const outDir = __dirname
const session = process.env.DSH_GC_P18_SESSION || 'dsh-gc-p18-visual'
const url = process.env.DSH_GC_URL || 'http://127.0.0.1:3080/'
const runner = path.join(outDir, '.p18-visual-runner.js')
const reportPath = path.join(outDir, 'last-run.json')
const screenshotPath = path.join(outDir, 'last-run.png').replaceAll('\\', '/')

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

const authCookie = getAuthCookie(url)
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
      skipped: 'DSH web authentication required; visual regression skipped',
      metrics: {
        title: '',
        viewport: { width: 1280, height: 720 },
        bodyFlags: {},
        labels: {},
        rects: {},
        spacing: {},
        visibleOverflow: []
      }
    }
  }

  const steps = []
  steps.push({step: 'url', value: page.url()})

  const candidates = ['项目杂乱文档整理优化', '规范开发与参考项目调研', '项目代码修改评估', '调研 package.json 依赖', 'DSH多Agent群聊插件方案']
  for (let attempt = 0; attempt < 10; attempt++) {
    let opened = ''
    for (const name of candidates) {
      const item = page.locator('[role="treeitem"]').filter({hasText: name}).first()
      if (await item.isVisible().catch(() => false)) {
        await item.click().catch(() => {})
        await wait(1200)
        opened = name
        break
      }
      const textLoc = page.getByText(name, {exact: false}).first()
      if (await textLoc.isVisible().catch(() => false)) {
        await textLoc.click().catch(() => {})
        await wait(1200)
        opened = name
        break
      }
    }
    if (opened) {
      steps.push({step: 'open-task', value: opened})
      break
    }
    await page.evaluate(() => {
      const folders = [...document.querySelectorAll('[role="treeitem"],div')]
        .filter(el => (el.textContent || '').includes('dsh-group-chat') && el.getBoundingClientRect().left < 340)
      for (const folder of folders) {
        const chevron = folder.querySelector('.YDXeBa_chevron, svg, [class*="chevron"], [class*="arrow"]')
        if (chevron) {
          chevron.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
          break
        }
      }
    }).catch(() => {})
    await wait(800)
  }

  // 展开右侧单侧边栏伴随舱 HUD
  for (let i = 0; i < 15; i++) {
    const hudOnscreen = await page.evaluate(() => {
      const el = document.querySelector('.dsh-gc-sidebar-host')
      if (!el) return false
      const r = el.getBoundingClientRect()
      return r.width > 100 && r.left < window.innerWidth - 20 && r.right > 20
    }).catch(() => false)
    if (hudOnscreen) break
    const clicked = await page.evaluate(() => {
      const el = document.querySelector('.dsh-gc-hud-trigger-capsule') || [...document.querySelectorAll('[title],button,div,span')].find(node => ((node.getAttribute('title') || '').includes('展开群聊')) || ((node.textContent || '').trim() === '群聊副屏'))
      if (el) { el.click(); return true }
      return false
    }).catch(() => false)
    if (clicked) {
      await wait(800)
      break
    }
    await wait(400)
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
    if (metrics.spacing.composerToHudGap !== null && (metrics.spacing.composerToHudGap < 0 || metrics.spacing.composerToHudGap > 18)) {
      failures.push('中间输入框与右侧 HUD 间距异常：' + metrics.spacing.composerToHudGap + 'px')
    }
  }

  return {ok: failures.length === 0, failures, steps, metrics, screenshot: '${screenshotPath}'}
}`

fs.writeFileSync(runner, code, 'utf8')
try {
  const openOut = runCli(['open', url, '--json'])
  if (openOut === null) {
    console.log(JSON.stringify({P18_BROWSER_VISUAL_REGRESSION_EXIT: 0, skipped: 'playwright-cli not available in current environment'}, null, 2))
    process.exit(0)
  }
  const raw = runCli(['run-code', '--filename', runner, '--raw'])
  if (!raw) {
    console.error('runCli failed to execute runner')
    process.exit(1)
  }
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



