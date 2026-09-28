const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const errors = []
const exists = p => fs.existsSync(path.join(root, p))
const read = p => fs.readFileSync(path.join(root, p), 'utf8')

const CANONICAL_PACKAGE_NAME = '@dsh-external/dsh-let-them-cook'
const LEGACY_PACKAGE_NAME = '@dsh-external/dsh-group-chat'
const DSH_WEB_PROFILE_PATCH = path.join(process.env.HOME || '', '.dsh', 'profiles', 'web', 'cordis.patch.yml')

function assertTextIncludes(file, text, message) {
  if (!read(file).includes(text)) errors.push(message)
}

const rootEntries = fs.readdirSync(root, {withFileTypes: true})
for (const entry of rootEntries) {
  if (/\.(md|txt)$/i.test(entry.name) && !['README.md', 'AGENTS.md'].includes(entry.name)) errors.push(`root document must live under docs/: ${entry.name}`)
  if (entry.isDirectory() && entry.name.toLowerCase() === 'docs' && entry.name !== 'docs') errors.push(`documentation directory must use canonical lowercase path: ${entry.name}`)
}
const tempDocs = fs.readdirSync(path.join(root, 'docs')).filter(file => /^_patch/i.test(file))
if (tempDocs.length) errors.push(`temporary patch docs remain: ${tempDocs.join(', ')}`)

function collectNumberedPhasePaths(dir) {
  const matches = []
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name)
    const relative = path.relative(root, full).split(path.sep).join('/')
    if (/(^|\/)(?:p\d+|phase[-_]?\d+|\d+[-_]?phase)(?:[-_.\/]|$)/i.test(relative)) matches.push(relative)
    if (entry.isDirectory()) matches.push(...collectNumberedPhasePaths(full))
  }
  return matches
}
const numberedPhasePaths = collectNumberedPhasePaths(path.join(root, 'docs'))
if (numberedPhasePaths.length) errors.push(`numbered phase paths are forbidden: ${numberedPhasePaths.join(', ')}`)

function countDocs(dir) {
  let count = 0
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      count += countDocs(full)
    } else if (/\.(md|txt)$/i.test(entry.name)) {
      count++
    }
  }
  return count
}
const docCount = countDocs(path.join(root, 'docs'))
if (docCount > 15) errors.push(`Anti-Process Bloat Guardrail tripped: total docs count ${docCount} exceeds ceiling of 15`)

const testFiles = fs.readdirSync(path.join(root, '__tests__')).filter(file => file.endsWith('.cjs'))
if (testFiles.length > 8) errors.push(`Anti-Test Bloat Guardrail tripped: test files count ${testFiles.length} exceeds ceiling of 8`)

const required = [
  'README.md',
  'AGENTS.md',
  'docs/TODO.md',
  'docs/tasks/domain-index.md',
  'docs/agents/01-ui-and-lifecycle.md',
  'docs/agents/02-tools-and-ledger.md',
  'docs/agents/03-orchestration-and-anti-stall.md',
  'docs/agents/04-i18n-personas-workspaces.md',
  'src/compat/dsh.ts',
  'src/engine/agent-runtime.ts',
  'src/engine/auto-setup.ts',
  'src/engine/model-recommender.ts',
  'src/engine/structured-result.ts',
  'src/client/GroupChatSideDock.tsx',
  'src/client/group-chat-hud-types.ts',
  'src/client/group-chat-hud-styles.ts',
  'scripts/test-matrix.cjs',
  'scripts/api-smoke.cjs',
  'scripts/e2e-no-llm.cjs',
  '__tests__/suite-01-room-and-lifecycle.cjs',
  '__tests__/suite-02-workflow-dag.cjs',
  '__tests__/suite-03-runtime-anti-stall.cjs',
  '__tests__/suite-04-tools-and-ledger.cjs',
  '__tests__/suite-05-personas-and-i18n.cjs',
  '__tests__/suite-06-e2e-closed-loop.cjs',
]
for (const file of required) if (!exists(file)) errors.push(`missing required artifact: ${file}`)

const pkg = JSON.parse(read('package.json'))
const lock = JSON.parse(read('package-lock.json'))
const requiredPackageScripts = ['typecheck', 'build:all', 'test', 'test:matrix', 'smoke:api', 'test:e2e:no-llm', 'preflight']
for (const script of requiredPackageScripts) {
  if (!pkg.scripts?.[script]) errors.push(`missing package script: ${script}`)
}
if (pkg.name !== CANONICAL_PACKAGE_NAME) errors.push(`package name drift: expected ${CANONICAL_PACKAGE_NAME}, got ${pkg.name}`)
if (lock.name !== CANONICAL_PACKAGE_NAME) errors.push(`package-lock root name drift: expected ${CANONICAL_PACKAGE_NAME}, got ${lock.name}`)
if (lock.packages?.['']?.name !== CANONICAL_PACKAGE_NAME) errors.push(`package-lock packages[""] name drift: expected ${CANONICAL_PACKAGE_NAME}, got ${lock.packages?.['']?.name}`)
if (pkg.main !== './lib/index.js') errors.push('package main must point to ./lib/index.js')
if (!pkg.dsh?.client?.inject?.includes('@deepseek-ai/dsh-client-runtime')) errors.push('dsh client runtime injection missing')

const hostEntry = read('src/index.ts')
const tsdown = read('tsdown.config.ts')
if (!hostEntry.includes(`export const name = '${CANONICAL_PACKAGE_NAME}'`)) errors.push(`host plugin export name must be ${CANONICAL_PACKAGE_NAME}`)
if (!tsdown.includes(`id: "${CANONICAL_PACKAGE_NAME}"`)) errors.push(`client bundle must register ${CANONICAL_PACKAGE_NAME} with __ModuleLoader__`)
if (hostEntry.includes(`export const name = '${LEGACY_PACKAGE_NAME}'`)) errors.push(`host plugin export name must not use legacy package name ${LEGACY_PACKAGE_NAME}`)
if (pkg.name === LEGACY_PACKAGE_NAME || lock.name === LEGACY_PACKAGE_NAME || lock.packages?.['']?.name === LEGACY_PACKAGE_NAME) errors.push(`legacy package identity ${LEGACY_PACKAGE_NAME} is forbidden in package metadata`)
if (fs.existsSync(DSH_WEB_PROFILE_PATCH)) {
  const profilePatch = fs.readFileSync(DSH_WEB_PROFILE_PATCH, 'utf8')
  if (!profilePatch.includes(`name: '${CANONICAL_PACKAGE_NAME}'`) && !profilePatch.includes(`name: "${CANONICAL_PACKAGE_NAME}"`) && !profilePatch.includes(`name: ${CANONICAL_PACKAGE_NAME}`)) errors.push(`DSH web profile patch must load ${CANONICAL_PACKAGE_NAME}`)
  if (profilePatch.includes(LEGACY_PACKAGE_NAME)) errors.push(`DSH web profile patch must not load legacy package ${LEGACY_PACKAGE_NAME}`)
}

const agents = read('AGENTS.md')
if (!agents.includes('不破坏底座核心源码')) errors.push('AGENTS.md core-source guard missing')
if (!agents.includes('/docs')) errors.push('AGENTS.md docs placement guard missing')
if (!agents.includes('Universal Master Handoff')) errors.push('AGENTS.md universal handoff guard missing')
if (!agents.includes('三纯原则')) errors.push('AGENTS.md pure principles guard missing')
if (/ctx\.version/.test(read('src/compat/dsh.ts'))) errors.push('compat must not access ctx.version directly')


const clientEntry = read('src/client/index.ts')
if (clientEntry.includes('conversation.view') || clientEntry.includes('GroupChatConversationView') || clientEntry.includes('GroupChatConversationTab')) errors.push('client entry must not register a duplicate middle Agent 群聊 tab')
if (!clientEntry.includes('sidebar.right.pane.tab') || !clientEntry.includes('sidebarRightTabs')) errors.push('native rightbar Agent 群聊 tab missing')

const dock = read('src/client/GroupChatSideDock.tsx')
const topControls = read('src/client/GroupChatHudTopControls.tsx')
const workflowPanel = read('src/client/GroupChatHudWorkflowPanel.tsx')
const rosterPanel = read('src/client/GroupChatHudRosterPanel.tsx')
const scratchpadPanel = read('src/client/GroupChatHudScratchpadPanel.tsx')
const hudSurface = dock + '\n' + topControls + '\n' + workflowPanel + '\n' + rosterPanel + '\n' + scratchpadPanel
if (dock.includes('GroupChatPanel') || dock.includes("label: '特遣对话'")) errors.push('HUD must not duplicate extension chat entry')
if (clientEntry.includes('conversation.input.left') || clientEntry.includes('GroupChatInputEntry')) errors.push('official composer must remain 100% untouched without GroupChatInputEntry or conversation.input.left')
if (dock.includes('<GroupChatHeroEntry') || dock.includes('GroupChatHeroEntry />')) errors.push('new session hero entry must not be mounted; keep official blank hero intact')
for (const marker of ['结构化结果','标记已读','默认（沙雕整活）','默认（工作流）']) if (!hudSurface.includes(marker)) errors.push(`HUD marker missing: ${marker}`)

const todo = read('docs/TODO.md')
for (const domain of ['UI 与生命周期','工具、账本与权限','调度、工作流与防停滞','国际化、主题与工作区','测试、发布与质量门禁','历史废弃方案','后续路线图']) {
  if (!todo.includes(`## ${domain}`)) errors.push(`TODO missing domain: ${domain}`)
}

if (errors.length) { console.error(JSON.stringify({PREFLIGHT_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({PREFLIGHT_EXIT:0, rootDocumentsOk:true, tempPatchDocs:0, requiredArtifacts:required.length, packageScripts:requiredPackageScripts}, null, 2))


