from pathlib import Path
import zipfile,hashlib,json
r=Path.cwd();d=r/'Docs/model-scroll-repair'
report='''当前：角色模型配置与聊天视图 / 插件改动已构建并验证 / 刷新网页使用

Changed fields/branches:
- GroupChatRoleEditor -> GroupChatModelSettings: primary llmConfig provider/model, ordered resiliencePolicy.fallbackModels (up to 5), retry/timeout/backoff, server error display, modal focus/scroll.
- /agent/update -> validateModels + plugin-owned ModelSettingsStore + RoomManager.resiliencePolicy.
- /models -> ctx.llm.listProviders/listModels and host default selection; role recommendations are catalog-name heuristics, not capability benchmarks.
- Recent 20 provider/model pairs: saved selections and successful native role calls, persisted at C:/Users/Administrator/.dsh/dsh-group-chat/model-settings.json. No credentials stored.
- gc-chat-scroll contains gc-scroll-content, messages and sticky composer; full-height scrollbar, auto follow while at bottom, jump-to-latest, ResizeObserver cleanup, 13px prose/12px code.
- Shared client SSE, reference-counted and disposed by plugin ctx.effect.
- Only plugin src/lib changed. No DSH core, installed host modules, startup wrapper or host credentials changed in this task.

ARTIFACTS:
'''
for f in ['MODIFIED_FILE.zip','DIFF_FILE.patch','VERIFICATION.txt','ROLLBACK.sh']:report+=str(d/f)+'\n'
report+='''
Working directory for commands: C:/项目/dsh-group-chat
BASELINE command: node Docs/model-scroll-repair/check.mjs
Input: original src tree (before changes).
Literal output: {"modelEditor":false,"fallbackSave":false,"fullHeightScroll":false,"smallerFont":false}
Exit: 1 (expected regression assertions).

MODIFIED command: node Docs/model-scroll-repair/check.mjs
Input: modified src tree.
Literal output: {"modelEditor":true,"fallbackSave":true,"fullHeightScroll":true,"smallerFont":true}
Exit: 0.

MODIFIED command: node Docs/model-scroll-repair/test.mjs
Input: temporary plugin settings file, primary provider-a/primary failing with 503, provider-b/fallback succeeding; duplicates/invalid policy samples.
Literal output: PASS persistence, recents dedupe, validation, role update, primary failure -> fallback success
Exit: 0. Temporary fixture removed. No paid model calls in this test.

MODIFIED command: node Docs/model-scroll-repair/events-test.mjs
Input: two subscribers and an EventSource test double; unload.
Literal output: PASS shared SSE: one connection, two subscribers, last unsubscribe and plugin unload close connection
Exit: 0.

MODIFIED command: node Docs/model-scroll-repair/live-test.mjs
Input: live plugin API, backend role, cpa/gemini-3.8-flash-high -> win/gpt-5.3-codex-spark, invalid timeout -1.
Literal output:
PASS live API save/read fallback, recent IDs, registered catalog, invalid timeout rejected
RESTORED backend original model and equivalent original fallback behavior
Exit: 0.

Browser UI: filled visible primary and fallback fields, clicked Save, reopened editor. Readback:
{"primary":{"provider":"cpa","model":"gemini-3.8-flash-high","temperature":0.2},"policy":{"fallbackModels":[{"provider":"win","model":"gpt-5.3-codex-spark"}],"maxRetriesPerModel":2,"retryBackoffMs":1000,"timeoutMs":30000}}
Recent selector contained both exact provider/model pairs. Escape closed dialog.
Post-test restore API literal output:
{"restored":true,"model":{"provider":"","model":"","temperature":0.2},"fallback":[]}
Restored behavior: backend follows host default, no fallback models, retries=2/backoff=1000ms/timeout=30000ms. Recents retain the two real catalog selections.
Persistence verified by reopening ModelSettingsStore against the same file; host restart not performed. Reinject returned already active, not a reload.

Browser scroll command: node Docs/model-scroll-repair/eval.cjs Docs/model-scroll-repair/measure.js
Input: 30 browser-only Markdown fixture messages through intercepted room fetch; no server messages written.
Literal output:
{"messages":30,"remaining":0,"railBottom":751.3333587646484,"panelBottom":751.3333587646484,"lastMessageBottom":512.1041870117188,"composerTop":558,"font":"13px"}
Jump command: node Docs/model-scroll-repair/eval.cjs Docs/model-scroll-repair/jump.js
Literal output: {"jumpVisible":true}
After jump settled: {"remaining":-0.6669921875,"lastVisible":true,"jump":false}
Result: last message above sticky composer, scrollbar reaches panel bottom, subpixel bottom tolerance <1px. Browser reloaded afterward to remove fixture.
Browser tool commands exited 0.

MODIFIED command: npm run build:all
Input: plugin source. Result: host tsc and client tsdown both succeeded. Exit 0.
MODIFIED command: node node_modules/typescript/bin/tsc --noEmit --jsx react-jsx --target ES2023 --module NodeNext --moduleResolution NodeNext --esModuleInterop --skipLibCheck src/client/native-primitives.d.ts src/client/GroupChatPanel.tsx src/client/GroupChatSideDock.tsx src/client/GroupChatRoleEditor.tsx
Output: empty. Exit 0.
Host regression command: node Docs/scope-repair/check-api.mjs
Output: {"ok":true,"keys":["ok","value"]}. Exit 0.

ROLLBACK command: "C:/Program Files/Git/bin/bash.exe" -c "Docs/model-scroll-repair/ROLLBACK.sh Docs/model-scroll-repair/rollback-test-final"
Input: separate copy of modified src/lib.
Literal output: ROLLBACK PASS: original plugin files restored byte-for-byte
Exit: 0.
ROLLBACK behavior command: node Docs/model-scroll-repair/check.mjs Docs/model-scroll-repair/rollback-test-final
Literal output: {"modelEditor":false,"fallbackSave":false,"fullHeightScroll":false,"smallerFont":false}
Exit: 1 (original regression behavior restored).
The real src/lib remain modified; MODIFIED_FILE.zip remains modified. ROLLBACK.sh requires an explicit target directory, restores only manifest paths, and verifies every restored file byte-for-byte. It preserves plugin model settings.

Maintenance: edit plugin src only, run npm run build:all, reload plugin/client. Models still run through the existing scoped agent/request pipeline; no direct provider HTTP client added.
'''
(d/'VERIFICATION.txt').write_text(report,encoding='utf-8')
with zipfile.ZipFile(d/'MODIFIED_FILE.zip') as z:
 assert z.testzip() is None
 for name in z.namelist():assert z.read(name)==(r/name).read_bytes()
 print('REOPEN MODIFIED_FILE.zip: 21 entries match deployed plugin files')
for name in ['DIFF_FILE.patch','VERIFICATION.txt','ROLLBACK.sh']:
 content=(d/name).read_text(encoding='utf-8');assert content
 print('REOPEN',name, len(content),'chars')
for h in json.loads((d/'original-hashes.json').read_text(encoding='utf-8-sig')):
 rel=Path(h['Path']).relative_to(r);assert hashlib.sha256((d/'original'/rel).read_bytes()).hexdigest().upper()==h['Hash']
print('PASS preserved original source hashes')
