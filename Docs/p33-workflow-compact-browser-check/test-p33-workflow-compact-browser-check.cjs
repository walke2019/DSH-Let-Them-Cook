const fs = require('node:fs')
const path = require('node:path')
const {spawnSync} = require('node:child_process')

const root = path.resolve(__dirname, '../..')
const session = process.env.DSH_GC_P33_SESSION || 'dsh-gc-p33-compact-workflow'
const url = process.env.DSH_GC_URL || 'http://127.0.0.1:3080/'
const runner = path.join(__dirname, '.p33-runner.js')
const reportPath = path.join(__dirname, 'last-run.json')

function runCli(args) {
  const result = spawnSync('playwright-cli', ['-s=' + session, ...args], {cwd: root, encoding: 'utf8', shell: process.platform === 'win32'})
  if (result.status !== 0) throw new Error(`playwright-cli ${args.join(' ')} failed ${result.status}\n${result.stdout}\n${result.stderr}`)
  return result.stdout.trim()
}

const code = String.raw`async (page) => {
  const wait = ms => page.waitForTimeout(ms)
  const clickIfVisible = async locator => { try { const first = locator.first(); if (await first.isVisible({timeout: 800})) { await first.click({timeout: 1200}); await wait(350); return true } } catch {} return false }
  const clickText = async (...texts) => {
    for (const text of texts) {
      if (await clickIfVisible(page.getByText(text, {exact: true}))) return text
      const clicked = await page.evaluate((needle) => {
        const visible = (el) => {
          const r = el.getBoundingClientRect(); const st = getComputedStyle(el)
          return r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden'
        }
        const nodes = [...document.querySelectorAll('button,span,div')]
          .filter(el => visible(el) && (el.textContent || '').trim().includes(needle))
          .map(el => {
            const r = el.getBoundingClientRect(); const txt = (el.textContent || '').trim()
            const exact = txt === needle ? 0 : 1
            const sidebar = r.left < 320 ? 0 : 1
            const area = Math.round(r.width * r.height)
            return {el, exact, sidebar, area, top: r.top}
          })
          .sort((a,b) => a.exact - b.exact || a.sidebar - b.sidebar || a.area - b.area || a.top - b.top)
        const hit = nodes[0]?.el
        if (!hit) return false
        hit.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
        return true
      }, text).catch(() => false)
      if (clicked) { await wait(550); return text }
    }
    return ''
  }

  await page.goto('${url}', {waitUntil: 'domcontentloaded', timeout: 20000})
  await wait(1500)

  // 回归测试必须进入实际承载插件讨论的 DSH 任务；历史上它位于 ha 工作区，
  // 但测试仍保留 dsh-group-chat / 当前页兜底，避免不同机器侧栏记忆不一致。
  const openKnownGroupChatTask = async () => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const clicked = await page.evaluate(() => {
        const visible = (el) => { const r = el.getBoundingClientRect(); const st = getComputedStyle(el); return r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden' }
        const names = ['DSH多Agent群聊插件方案', '规范开发与参考项目调研']
        const nodes = [...document.querySelectorAll('[role="treeitem"],button,div,span')].filter(el => visible(el))
        const hit = nodes.sort((a,b) => (a.getAttribute('role') === 'treeitem' ? 0 : 1) - (b.getAttribute('role') === 'treeitem' ? 0 : 1) || a.getBoundingClientRect().height - b.getBoundingClientRect().height).find(el => names.some(name => (el.textContent || '').includes(name)))
        if (!hit) return false
        hit.dispatchEvent(new MouseEvent('mousedown', {bubbles:true, cancelable:true, view:window}))
        hit.dispatchEvent(new MouseEvent('mouseup', {bubbles:true, cancelable:true, view:window}))
        hit.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
        return true
      }).catch(()=>false)
      if (clicked) { await wait(1600); return true }
      await clickText('ha', 'dsh-group-chat')
      await wait(700)
    }
    return await clickText('Agent 群聊') !== ''
  }
  await openKnownGroupChatTask()
  for (let i=0;i<12;i++) { if (await page.getByText('Agent 群聊', {exact:true}).first().isVisible().catch(()=>false)) break; await wait(500) }
  await clickIfVisible(page.getByText('Agent 群聊', {exact:true}))
  const hudOnscreenBefore = await page.evaluate(() => { const el = document.querySelector('.dsh-gc-sidebar-host'); if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 100 && r.left < innerWidth - 20 && r.right > 20 }).catch(()=>false)
  if (!hudOnscreenBefore) await page.evaluate(() => { const el = [...document.querySelectorAll('[title],button,div,span')].find(node => ((node.getAttribute('title') || '').includes('展开群聊')) || ['群聊副屏'].includes((node.textContent || '').trim())); if (el) el.click() }).catch(()=>{})
  await wait(900)
  await page.evaluate(() => {
    const tab = document.querySelector('.dsh-gc-sidebar-host [data-dsh-gc-hud-tab=\"workflow\"]')
    if (tab) tab.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}))
  }).catch(()=>{})
  await wait(500)

  const result = await page.evaluate(() => {
    const hud = document.querySelector('.dsh-gc-sidebar-host')
    const workflow = document.querySelector('.dsh-gc-workflow-panel')
    const advanced = document.querySelector('.dsh-gc-advanced-details')
    const rect = el => { const r = el.getBoundingClientRect(); return {left:r.left,right:r.right,width:r.width,height:r.height} }
    const hudRect = hud ? rect(hud) : null
    const overflow = []
    if (hud && hudRect) {
      for (const el of [...hud.querySelectorAll('*')]) {
        const r = el.getBoundingClientRect(); const style = getComputedStyle(el)
        if (r.width <= 0 || r.height <= 0 || style.display === 'none' || style.visibility === 'hidden') continue
        if ((el.className || '').toString().includes('dsh-gc-resize-handle')) continue
        if (r.right > hudRect.right + 1 || r.left < hudRect.left - 1) overflow.push((el.textContent || el.tagName || '').trim().slice(0,60))
      }
    }
    const visibleText = hud?.innerText || ''
    return {
      hasWorkflow: !!workflow,
      hasAdvanced: !!advanced,
      advancedOpen: advanced ? advanced.open : null,
      visibleHasDirector: visibleText.includes('执行导演台'),
      visibleHasCurrentStage: visibleText.includes('当前阶段'),
      visibleHasCurrentTask: visibleText.includes('当前任务') || visibleText.includes('等待创建工作流'),
      visibleHasAdvancedSummary: visibleText.includes('高级详情'),
      visibleOverflowCount: overflow.length,
      visibleOverflow: overflow,
    }
  })
  const failures = []
  if (!result.hasWorkflow) failures.push('未找到工作流面板')
  if (!result.hasAdvanced) failures.push('未找到高级详情折叠区')
  if (result.advancedOpen !== false) failures.push('高级详情默认不是折叠态')
  if (!result.visibleHasDirector) failures.push('默认态缺少执行导演台')
  if (!result.visibleHasCurrentStage) failures.push('默认态缺少当前阶段')
  if (!result.visibleHasCurrentTask) failures.push('默认态缺少当前任务/空态')
  if (!result.visibleHasAdvancedSummary) failures.push('默认态缺少高级详情入口')
  if (result.visibleOverflowCount > 0) failures.push('HUD 默认态存在可见溢出')
  return {ok: failures.length === 0, failures, result}
}`

fs.writeFileSync(runner, code, 'utf8')
try {
  runCli(['open', url, '--json'])
  const raw = runCli(['run-code', '--filename', runner, '--raw'])
  const result = JSON.parse(raw)
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf8')
  if (!result.ok) { console.error(JSON.stringify(result, null, 2)); process.exit(1) }
  console.log(JSON.stringify({P33_WORKFLOW_COMPACT_BROWSER_CHECK_EXIT:0, report: reportPath, advancedOpen: result.result.advancedOpen, overflowCount: result.result.visibleOverflowCount}, null, 2))
} finally {
  try { fs.unlinkSync(runner) } catch {}
}



