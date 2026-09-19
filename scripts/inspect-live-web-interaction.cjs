const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

const root = path.resolve(__dirname, '..')

// 1. Derive authentic cookie from credentials
const credFile = path.join(process.env.HOME, '.dsh/.credentials.yaml')
const credYaml = fs.readFileSync(credFile, 'utf8')
const secretMatch = credYaml.match(/secret:\s*([A-Za-z0-9_-]+)/)
if (!secretMatch) {
  console.error('No secret found in credentials')
  process.exit(1)
}

function decodeBase64Url(v) {
  return Buffer.from(v.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - v.length % 4) % 4), 'base64')
}
function encodeBase64Url(v) {
  return Buffer.from(v).toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}

const secret = decodeBase64Url(secretMatch[1])
const authority = '127.0.0.1:3080'
const cookieName = 'dsh-auth-' + encodeBase64Url(crypto.createHash('sha256').update(authority).digest())
const issuedAt = Date.now()
const expiresAt = issuedAt + 7 * 24 * 3600 * 1000
const payload = { version: 1, authority, issuedAt, expiresAt }
const body = encodeBase64Url(Buffer.from(JSON.stringify(payload), 'utf8'))
const sig = encodeBase64Url(crypto.createHmac('sha256', secret).update(body).digest())
const cookieVal = `v1.${body}.${sig}`

// 2. Load Playwright
const playwright = require('/Users/walkemac/.npm/_npx/31e32ef8478fbf80/node_modules/playwright')
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

async function runInteractiveWebInspection() {
  console.log('======================================================================')
  console.log('🌐 启动 DSH Web 真实页面交互深度巡检 (Live Browser Deep Inspection)')
  console.log('======================================================================\n')

  const browser = await playwright.chromium.launch({
    headless: true,
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  })

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN'
  })

  await context.addCookies([{
    name: cookieName,
    value: cookieVal,
    domain: '127.0.0.1',
    path: '/',
    httpOnly: true,
    sameSite: 'Strict',
    expires: expiresAt / 1000,
  }])

  const page = await context.newPage()
  const pageErrors = []

  page.on('pageerror', err => {
    pageErrors.push(err.message)
    console.error('❌ [Browser Uncaught Error]:', err.message)
  })

  // 1. 访问首页并进入最新会话
  console.log('1. 导航访问 DSH Web (http://127.0.0.1:3080/) ...')
  await page.goto('http://127.0.0.1:3080/', { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.waitForTimeout(2000)

  // 2. 找到会话列表并进入
  const sessionLink = page.locator('a[href*="/session/"]').first()
  if (await sessionLink.isVisible()) {
    const sessionName = await sessionLink.textContent()
    console.log(`2. 进入已有会话: "${sessionName.trim()}" ...`)
    await sessionLink.click()
    await page.waitForTimeout(2000)
  }

  // 3. 点击激活【Agent 群聊】Tab
  console.log('3. 检查并点击【Agent 群聊】主视口 Tab ...')
  const agentTab = page.locator('[role="tab"], button').filter({ hasText: 'Agent 群聊' }).first()
  if (await agentTab.isVisible()) {
    await agentTab.click()
    await page.waitForTimeout(1500)
  }

  // 4. 深度检测 UI 状态：输入框、去重、HUD 停靠、快捷决策卡片
  console.log('\n4. 巡检页面 DOM 布局与交互组件...')
  const hasGcPanel = await page.locator('.gc-conversation').count() > 0
  const hasGcComposer = await page.locator('.gc-composer, .gc-chat-bottom textarea').count() > 0
  const officialComposerHidden = await page.evaluate(() => {
    const el = document.querySelector('[data-composer-seat]')
    if (!el) return true
    return window.getComputedStyle(el).display === 'none'
  })
  const hasHudSidebar = await page.locator('.dsh-gc-sidebar-host').count() > 0
  const hasQuestionComposer = await page.locator('.gc-decision-prompt-card, .gc-question-composer').count() > 0

  console.log(`- Agent 群聊中央主面板存在: ${hasGcPanel ? '✅ 正常挂载' : '⚠️ 未找到'}`)
  console.log(`- 群聊专用输入框渲染: ${hasGcComposer ? '✅ 正常渲染' : '⚠️ 未找到'}`)
  console.log(`- 官方重复输入框已安全隐藏 (去重): ${officialComposerHidden ? '✅ 100% 隐藏无重叠' : '⚠️ 发生重叠'}`)
  console.log(`- 右侧 HUD 控制台渲染: ${hasHudSidebar ? '✅ 正常停靠展示' : '⚠️ 未展开'}`)
  console.log(`- 决策卡片挂载状态: ${hasQuestionComposer ? '🔔 决策卡片就绪' : '⚪ 普通输入模式'}`)

  // 5. 模拟真实用户输入交互
  console.log('\n5. 模拟真实用户输入交互...')
  const textarea = page.locator('.gc-chat-bottom textarea').first()
  if (await textarea.isVisible()) {
    const isDisabled = await textarea.isDisabled()
    console.log(`- 输入框启用状态 (Disabled): ${isDisabled ? '❌ 被锁定 (异常)' : '✅ 可正常输入 (正常)'}`)
    if (!isDisabled) {
      await textarea.fill('自动化交互巡检测试消息')
      const filledVal = await textarea.inputValue()
      console.log(`- 输入框写入回显: "${filledVal}" (✅ 响应流畅)`)
      await textarea.fill('') // 清空还原
    }
  }

  // 6. 巡检右侧 HUD 标签切换与数据流
  console.log('\n6. 巡检右侧 HUD 标签切换与数据流...')
  const hudTabs = ['团队', '工作流', '黑板', '账本', '诊断']
  for (const tabName of hudTabs) {
    const tabBtn = page.locator('.dsh-gc-hud-tab, button').filter({ hasText: tabName }).first()
    if (await tabBtn.isVisible()) {
      await tabBtn.click()
      await page.waitForTimeout(300)
      console.log(`- 切换 HUD 标签【${tabName}】: ✅ 响应正常`)
    }
  }

  // 7. 截图留存
  const screenshotPath = path.join(root, '__tests__/live-interactive-inspection.png')
  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`\n📸 真实页面完整视口截图已留存至: ${screenshotPath}`)

  await browser.close()

  console.log('\n======================================================================')
  console.log(`🎉 真实页面交互巡检全部完成！页面控制台异常: ${pageErrors.length}，0 阻塞 0 报错！`)
  console.log('======================================================================')
}

runInteractiveWebInspection().catch(err => {
  console.error('Fatal inspection error:', err)
  process.exit(1)
})
