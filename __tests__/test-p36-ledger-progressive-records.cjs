const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const roster = read('src/client/GroupChatHudRosterPanel.tsx')
const docs = read('docs/tasks/phases/p36-ledger-progressive-records/README.md')
const errors = []
for (const marker of [
  "import {useMemo, useState} from 'react'",
  "const [ledgerSearch, setLedgerSearch] = useState('')",
  "const [ledgerFilter, setLedgerFilter] = useState<'all' | 'active' | 'unread'>('all')",
  'assignmentRecords = useMemo',
  'mailboxRecords = useMemo',
  '完整流水',
  'data-dsh-gc-ledger-records',
  'data-dsh-gc-ledger-search',
  'data-dsh-gc-ledger-filters',
  'filteredAssignments.map',
  'filteredMailbox.map',
  '任务分派', 'Assignments', 'filteredAssignments.length' ,
  '主 Agent 邮箱', 'Master Agent mailbox', 'filteredMailbox.length',
]) {
  if (!roster.includes(marker)) errors.push(`roster missing marker: ${marker}`)
}
if (/room\.assignments[\s\S]{0,120}slice\(-\d+\)/.test(roster)) errors.push('Assignment ledger must not slice recent records')
if (/mailboxes[\s\S]{0,200}slice\(-\d+\)/.test(roster)) errors.push('Mailbox ledger must not slice recent records')
if (roster.includes('msg.content.slice(0,160)')) errors.push('Mailbox content must not be hard-truncated in complete ledger')
for (const marker of ['完整流水','全部 / 进行中 / 未读','不再 `slice(-n)` 截断']) {
  if (!docs.includes(marker)) errors.push(`P36 doc missing: ${marker}`)
}
if (errors.length) { console.error(JSON.stringify({P36_LEDGER_PROGRESSIVE_RECORDS_EXIT:1, errors}, null, 2)); process.exit(1) }
console.log(JSON.stringify({P36_LEDGER_PROGRESSIVE_RECORDS_EXIT:0, ledger:'complete-filterable-progressive'}, null, 2))

