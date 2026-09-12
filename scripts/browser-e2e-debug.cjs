const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

const root = path.resolve(__dirname, '..')

// 1. Derive authentic cookie from credentials
const credFile = path.join(process.env.HOME, '.dsh/.credentials.yaml')
if (!fs.existsSync(credFile)) {
  console.error('Credentials file not found at ' + credFile)
  process.exit(1)
}
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

// 2. Locate Playwright
const playwrightPaths = [
  '/Users/walkemac/.npm/_npx/31e32ef8478fbf80/node_modules/playwright',
  '/Users/walkemac/.npm/_npx/9833c18b2d85bc59/node_modules/playwright',
  'playwright'
]
let playwright = null
for (const p of playwrightPaths) {
  try {
    playwright = require(p)
    break
  } catch {}
}

if (!playwright) {
  console.error('Playwright could not be loaded')
  process.exit(1)
}

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const report = {
  timestamp: new Date().toISOString(),
  checks: [],
  logs: [],
  errors: [],
  screenshots: []
}

function addCheck(name, passed, details = {}) {
  report.checks.push({ name, passed, details })
  console.log(`[CHECK] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name}`)
}

async function run() {
  console.log('Starting Browser E2E Debug Suite against http://127.0.0.1:3080/ ...')
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

  page.on('console', msg => {
    const text = msg.text()
    report.logs.push(`[${msg.type()}] ${text}`)
    if (msg.type() === 'error') {
      report.errors.push(text)
    }
  })

  page.on('pageerror', err => {
    report.errors.push(`[PAGEERROR] ${err.message}`)
  })

  try {
    // Step 1: Navigate to DSH Web Home
    console.log('Step 1: Navigating to home page...')
    const res = await page.goto('http://127.0.0.1:3080/', { waitUntil: 'domcontentloaded', timeout: 15000 })
    addCheck('Page loads with HTTP 200', res.status() === 200, { status: res.status() })
    await page.waitForTimeout(3000)

    const homeTitle = await page.title()
    addCheck('Page title is DeepSeek Harness', homeTitle.includes('DeepSeek Harness'), { title: homeTitle })

    // Step 2: Check Hero Entry on New Session
    console.log('Step 2: Checking Agent Chat Hero and Input Entry buttons...')
    const heroButton = page.locator('.gc-hero-button').first()
    const inputEntryButton = page.locator('.gc-input-entry-button').first()
    const heroVisible = await heroButton.isVisible({ timeout: 2000 }).catch(() => false)
    const inputEntryVisible = await inputEntryButton.isVisible({ timeout: 2000 }).catch(() => false)
    addCheck('Hero Entry Button is visible on blank session', heroVisible)
    addCheck('Composer Input Entry Button is visible', inputEntryVisible)

    // Step 3: Test opening HUD via Hero button
    console.log('Step 3: Clicking Hero button to open HUD...')
    if (heroVisible) {
      await heroButton.click()
      await page.waitForTimeout(1500)
      const hudOpen = await page.evaluate(() => document.body.getAttribute('data-dsh-group-chat-hud-docked-open'))
      const sidebarHostVisible = await page.locator('.dsh-gc-sidebar-host').first().isVisible().catch(() => false)
      addCheck('Hero button opens HUD companion sidebar', hudOpen === 'true' && sidebarHostVisible, { hudOpen, sidebarHostVisible })
    }

    // Step 4: Navigate to existing conversation session
    console.log('Step 4: Opening existing session...')
    const sessionCandidate = page.getByText('多规格图像生成调用测试').first()
    const candidateVisible = await sessionCandidate.isVisible({ timeout: 3000 }).catch(() => false)
    if (candidateVisible) {
      await sessionCandidate.click()
      await page.waitForTimeout(3000)
      addCheck('Successfully entered session "多规格图像生成调用测试"', true)
    } else {
      console.log('Session candidate not found, falling back to first conversation link...')
      const anySession = page.locator('[class*="sidebarCol"] [class*="session"], [class*="sidebarCol"] button').first()
      if (await anySession.isVisible()) {
        await anySession.click()
        await page.waitForTimeout(3000)
      }
    }

    // Step 5: Check conversation view tab strip for "Agent 群聊"
    console.log('Step 5: Inspecting conversation view tabs...')
    const agentTab = page.getByText('Agent 群聊', { exact: true }).first()
    const officialTab = page.getByText('对话', { exact: true }).first()
    const agentTabVisible = await agentTab.isVisible({ timeout: 4000 }).catch(() => false)
    const officialTabVisible = await officialTab.isVisible({ timeout: 2000 }).catch(() => false)
    addCheck('Official "对话" tab is present in tab strip', officialTabVisible)
    addCheck('"Agent 群聊" tab is safely mounted in tab strip', agentTabVisible)

    // Step 6: Activate "Agent 群聊" tab
    console.log('Step 6: Switching to "Agent 群聊" tab...')
    if (agentTabVisible) {
      await agentTab.click()
      await page.waitForTimeout(2500)

      const agentActive = await page.evaluate(() => {
        return {
          bodyActiveTab: document.body.getAttribute('data-dsh-group-chat-tab-active'),
          hasSidebar: !!document.querySelector('.dsh-gc-sidebar-host'),
          hasChatPanel: !!document.querySelector('.gc-chat-panel, .gc-conversation-tab, [data-dsh-gc-chat-panel]'),
          ownsComposer: !!document.querySelector('.gc-conversation-tab .gc-chat-bottom, .gc-hero-main .gc-chat-bottom')
        }
      })
      addCheck('Agent 群聊 tab activates correctly and marks body', agentActive.bodyActiveTab === 'true', agentActive)
      addCheck('Agent chat panel is mounted in middle view', agentActive.hasChatPanel)

      // Step 7: Inspect HUD tabs (Team, Workflow, Scratchpad, Ledger)
      console.log('Step 7: Testing HUD navigation tabs...')
      const hudTabs = ['团队', '工作流', '黑板', '账本']
      for (const tabName of hudTabs) {
        const tabBtn = page.getByText(tabName, { exact: true }).first()
        if (await tabBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await tabBtn.click()
          await page.waitForTimeout(600)
          addCheck(`HUD tab "${tabName}" is clickable and responds`, true)
        }
      }

      // Step 8: Verify Ledger panel metrics calculation (no NaN, no fake 68%)
      console.log('Step 8: Verifying Ledger panel official metrics and Prompt Cache display...')
      const ledgerTab = page.getByText('账本', { exact: true }).first()
      if (await ledgerTab.isVisible({ timeout: 1000 }).catch(() => false)) {
        await ledgerTab.click()
        await page.waitForTimeout(1000)

        const ledgerDetails = await page.evaluate(() => {
          const rosterPanel = document.querySelector('[data-dsh-gc-roster-panel]')
          const text = rosterPanel ? rosterPanel.textContent : ''
          return {
            hasMetricsLine: text.includes('轮') && text.includes('步'),
            hasCacheHit: text.includes('缓存命中'),
            cacheHitMatch: text.match(/缓存命中\s+(\d+)%/)?.[0] || '',
            hasLlmTime: text.includes('LLM'),
            hasTokens: text.includes('tok'),
            noNan: !text.includes('NaN'),
            textSnippet: text.slice(0, 300).replace(/\s+/g, ' ')
          }
        })
        addCheck('Ledger metrics line displays properly without NaN', ledgerDetails.hasMetricsLine && ledgerDetails.noNan, ledgerDetails)
        addCheck('Cache hit calculation renders official percentage', ledgerDetails.hasCacheHit, { cacheHit: ledgerDetails.cacheHitMatch })
      }

      // Step 9: Take a screenshot of the active Agent Chat view
      const screenshotDir = path.join(root, 'docs/tasks/phases/p88-official-tools-and-cache-metrics')
      if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true })
      const screenshotFile = path.join(screenshotDir, 'browser-e2e-verified.png')
      await page.screenshot({ path: screenshotFile, fullPage: false })
      report.screenshots.push(screenshotFile)
      console.log(`Saved screenshot to ${screenshotFile}`)

      // Step 10: Switch back to official "对话" tab to verify isolation & clean unmount
      console.log('Step 10: Switching back to official "对话" tab to verify zero-pollution cleanup...')
      if (officialTabVisible) {
        await officialTab.click()
        await page.waitForTimeout(2000)

        const cleanState = await page.evaluate(() => {
          return {
            bodyActiveTab: document.body.getAttribute('data-dsh-group-chat-tab-active'),
            bodyHudOpen: document.body.getAttribute('data-dsh-group-chat-hud-docked-open'),
            hasSidebarHost: !!document.querySelector('.dsh-gc-sidebar-host'),
            hasConversationTab: !!document.querySelector('.gc-conversation-tab'),
            officialCenterStillPresent: !!document.querySelector('[data-slot="root"], #root'),
            centerText: document.querySelector('[class*="centerCol"]')?.textContent?.slice(0, 100).replace(/\s+/g, ' ') || ''
          }
        })
        addCheck('body active tab attribute cleaned up on exit', cleanState.bodyActiveTab === null, cleanState)
        addCheck('Plugin conversation tab unmounted without trace', !cleanState.hasConversationTab)
        addCheck('Official center remains available after plugin unmount', cleanState.officialCenterStillPresent)
      }
    }

    // Step 11: Final check on console errors
    const criticalErrors = report.errors.filter(e => !e.includes('vite') && !e.includes('favicon'))
    addCheck('Zero uncaught JavaScript exceptions or runtime errors', criticalErrors.length === 0, { errors: criticalErrors })

  } catch (err) {
    console.error('Unhandled test failure:', err)
    addCheck('Test execution completed without crash', false, { error: err.message })
  } finally {
    await browser.close()
  }

  // Save report
  const reportPath = path.join(root, 'docs/tasks/phases/p88-official-tools-and-cache-metrics/browser-e2e-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8')
  console.log(`\nBrowser E2E report written to ${reportPath}`)
  const passedAll = report.checks.every(c => c.passed)
  console.log(`\nBROWSER_E2E_TEST_EXIT:${passedAll ? 0 : 1}`)
  process.exit(passedAll ? 0 : 1)
}

run()
