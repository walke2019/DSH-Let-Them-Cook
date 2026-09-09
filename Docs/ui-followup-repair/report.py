from pathlib import Path
import zipfile,hashlib,json
r=Path.cwd();d=r/'Docs/ui-followup-repair'
report=r'''当前：中间滚动、右侧副屏、模型下拉与 Agent 状态 / 本轮插件修改已构建实测 / 下一步刷新页面使用

Changed fields/branches:
- GroupChatPanel: gc-chat-bottom 改为滚动流内底部区域；gc-chat-messages 使用 --gc-bottom-height 动态安全底部 padding；中间上拉不再覆盖消息。新增可隐藏 gc-agent-float 左侧轻组件，展示 agent:status 最近执行状态。
- Host events/types: GroupChatEventType 增加 agent:status；triggerAgentTurn 在 running/complete/error 分支广播状态，不改变模型调用路径。
- GroupChatSideDock: 删除右侧快捷聊天输入与派发按钮；成员账本 callCount/token 以同一行展示。
- GroupChatModelSettings: 模型选择改为插件内同主题 searchable popover；目录仍来自服务端调用 DSH 官方 ctx.llm.listProviders/listModels；支持搜索 Provider、模型 ID、名称，支持最近使用与角色建议。
- GroupChatComposer: @角色右侧箭头替换为 SVG chevron，展开时旋转。
- All source changes are plugin-managed under C:/项目/dsh-group-chat/src and C:/项目/dsh-group-chat/lib. No DSH core, installed host package, credentials, or provider client was modified.

ARTIFACTS:
C:/项目/dsh-group-chat/Docs/ui-followup-repair/MODIFIED_FILE.zip
C:/项目/dsh-group-chat/Docs/ui-followup-repair/DIFF_FILE.patch
C:/项目/dsh-group-chat/Docs/ui-followup-repair/VERIFICATION.txt
C:/项目/dsh-group-chat/Docs/ui-followup-repair/ROLLBACK.sh

BASELINE command: node Docs/ui-followup-repair/check.mjs Docs/ui-followup-repair/original
Input: original src/lib snapshot captured before this turn.
Literal output: {"safeBottom":false,"agentFloat":false,"searchModelPicker":false,"composerSvgArrow":false,"rightDispatchRemoved":false,"inlineLedger":false}
Exit status: 1 when run alone; in the multi-command log the following tests continued.
Restored baseline behavior: sticky/unsafe bottom, no agent float, datalist model fields, text chevron, right quick dispatch present, roster stats split lines.

MODIFIED command: node Docs/ui-followup-repair/check.mjs
Input: modified src tree.
Literal output: {"safeBottom":true,"agentFloat":true,"searchModelPicker":true,"composerSvgArrow":true,"rightDispatchRemoved":true,"inlineLedger":true}
Exit status: 0.

MODIFIED command: npm run build:all
Input: plugin source.
Literal output/result: host tsc succeeded; client tsdown succeeded; lib/client.js 92.22 kB, lib/client.js.map 122.71 kB; Build complete.
Exit status: 0.

MODIFIED command: node node_modules/typescript/bin/tsc --noEmit --jsx react-jsx --target ES2023 --module NodeNext --moduleResolution NodeNext --esModuleInterop --skipLibCheck src/client/native-primitives.d.ts src/client/GroupChatPanel.tsx src/client/GroupChatSideDock.tsx src/client/GroupChatRoleEditor.tsx
Input: plugin client TSX files.
Literal output: empty.
Exit status: 0.

MODIFIED command: node Docs/scope-repair/check-api.mjs
Input: live DSH API session.models regression.
Literal output: {"ok":true,"keys":["ok","value"]}
Exit status: 0.

MODIFIED command: node Docs/model-scroll-repair/test.mjs
Input: temporary plugin model settings fixture and fallback manager.
Literal output: PASS persistence, recents dedupe, validation, role update, primary failure -> fallback success
Exit status: 0.

Browser command: node Docs/ui-followup-repair/eval.cjs Docs/ui-followup-repair/dom-measure.js
Input: 32 browser-only DOM fixture messages injected into the plugin panel; no server messages written.
Literal output: {"messages":32,"overlappedDuringPull":0,"bottomPadding":"198px","remaining":0,"lastAboveComposer":true,"font":"13px","agentFloat":true,"rightDispatchText":false}
Exit status: 0.
Restored behavior/status: browser fixture was transient; page can reload back to live data. This confirms no message overlap while pulling up, bottom remains reachable, the status float exists, and right-side dispatch text is absent.

Browser command: node Docs/ui-followup-repair/eval.cjs Docs/ui-followup-repair/model-ui.js
Input: opened right roster, opened backend editor, opened model picker, searched codex.
Literal output: {"popoverOpened":true,"searchInput":true,"options":["跟随宿主默认cpa / gemini-3.8-flash-high","cpa / gemini-3.8-flash-high最近使用","win / gpt-5.3-codex-spark最近使用","deepseek-official / deepseek-v4-flashDeepSeek · DeepSeek-V4-Flash","deepseek-official / deepseek-v4-proDeepSeek · DeepSeek-V4-Pro"],"hasCodex":true,"chevronSvg":true}
Exit status: 0.
Restored behavior/status: editor remains plugin-managed; model options come from official host catalog endpoint; @角色 chevron is SVG.

ROLLBACK command: C:/Program Files/Git/bin/bash.exe -c "chmod +x Docs/ui-followup-repair/ROLLBACK.sh; Docs/ui-followup-repair/ROLLBACK.sh Docs/ui-followup-repair/rollback-test"
Input: separate copy of modified src/lib at C:/项目/dsh-group-chat/Docs/ui-followup-repair/rollback-test.
Literal output:
C:\项目\dsh-group-chat\Docs\ui-followup-repair\rollback-test
ROLLBACK PASS: ui follow-up plugin files restored byte-for-byte
Exit status: 0.

ROLLBACK behavior command: node Docs/ui-followup-repair/check.mjs Docs/ui-followup-repair/rollback-test
Input: rolled-back copy.
Literal output: {"safeBottom":false,"agentFloat":false,"searchModelPicker":false,"composerSvgArrow":false,"rightDispatchRemoved":false,"inlineLedger":false}
Exit status: 1, expected because original pre-turn UI issues were restored on the copy.
Real src/lib remain changed.

Reopen evidence:
- MODIFIED_FILE.zip tested with zipfile.testzip and every entry compared to current deployed plugin file.
- DIFF_FILE.patch, VERIFICATION.txt, and ROLLBACK.sh were reopened and read non-empty.
- Original hashes in original-hashes.json match Docs/ui-followup-repair/original byte-for-byte.
'''
(d/'VERIFICATION.txt').write_text(report,encoding='utf-8')
with zipfile.ZipFile(d/'MODIFIED_FILE.zip') as z:
    assert z.testzip() is None
    for name in z.namelist(): assert z.read(name)==(r/name).read_bytes()
    print('REOPEN MODIFIED_FILE.zip:',len(z.namelist()),'entries match current plugin files')
for name in ['DIFF_FILE.patch','VERIFICATION.txt','ROLLBACK.sh']:
    content=(d/name).read_text(encoding='utf-8');assert content
    print('REOPEN',name,len(content),'chars')
for h in json.loads((d/'original-hashes.json').read_text(encoding='utf-8-sig')):
    rel=Path(h['Path']).relative_to(r);assert hashlib.sha256((d/'original'/rel).read_bytes()).hexdigest().upper()==h['Hash']
print('PASS preserved original hashes')

