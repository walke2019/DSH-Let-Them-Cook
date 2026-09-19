const { spawnSync } = require('node:child_process')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const steps = [
  ['npm', ['run', 'typecheck']],
  ['npm', ['run', 'build:all']],
  ['node', ['__tests__/suite-01-room-and-lifecycle.cjs']],
  ['node', ['__tests__/suite-02-workflow-dag.cjs']],
  ['node', ['__tests__/suite-03-runtime-anti-stall.cjs']],
  ['node', ['__tests__/suite-04-tools-and-ledger.cjs']],
  ['node', ['__tests__/suite-05-personas-and-i18n.cjs']],
  ['node', ['__tests__/suite-06-e2e-closed-loop.cjs']],
]

let failed = false
for (const [cmd, args] of steps) {
  console.log(`\n[MATRIX] ${cmd} ${args.join(' ')}`)
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.status !== 0) {
    console.error(`[MATRIX] failed: ${cmd} ${args.join(' ')} -> ${result.status}`)
    failed = true
    break
  }
}

if (failed) {
  process.exit(1)
}
console.log('\n[MATRIX] ALL 6 DOMAIN SUITES PASSED CLEANLY!')
