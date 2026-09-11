const fs = require('fs');
const report = 'docs/full-small-task-test/FULL_TEST_REPORT.md';
const json = 'docs/full-small-task-test/full-test-results.json';
const ui = 'docs/full-small-task-test/ui-final-check.js';
let allRecordedPassed = false;
try { allRecordedPassed = JSON.parse(fs.readFileSync(json, 'utf8')).every((x) => x.ok === true); } catch {}
const checks = [
  ['full report exists', fs.existsSync(report)],
  ['results json exists', fs.existsSync(json)],
  ['ui check script exists', fs.existsSync(ui)],
  ['report includes real agent reply', fs.existsSync(report) && fs.readFileSync(report, 'utf8').includes('开始种番茄')],
  ['all recorded checks passed', allRecordedPassed],
];
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
