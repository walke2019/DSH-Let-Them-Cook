# TODO — dsh-group-chat 当前开发清单

更新日期：2026-09-10

## 已完成主线

## P0 工具路由运行时
- [x] `runMemberTurn()` 支持 `allowedTools`。
- [x] 通过 DSH `tools.restrict()` 兼容层限制角色工具面。
- [x] 角色 Prompt 注入允许工具清单。
- [x] 默认角色工具名与真实注册工具对齐。

## P1 Assignment / Mailbox
- [x] 定义并持久化 `AssignmentEnvelope`。
- [x] 定义并持久化 `AgentMailboxMessage`。
- [x] 主 Agent 分派写入 assignment。
- [x] SubAgent 结果通过 mailbox 回传。

## P2 Workflow Task DAG + 质量门禁
- [x] `WorkflowStage.tasks`。
- [x] `WorkflowTask.dependsOn / ownerRoleId / verifyCommand / qualityContract`。
- [x] 任务状态支持 ready / running / passed / failed / request_human。
- [x] HUD 可手动修正任务状态。

## P3 模型推荐
- [x] DSH 模型目录兼容读取。
- [x] 按能力标签评分。
- [x] 用户手动模型优先，最近模型最多 6 条。
- [x] 支持回退模型。

## P4 兼容层与测试矩阵
- [x] `src/compat/dsh.ts`。
- [x] `npm run test:matrix`。

## P5 HUD 执行态展示
- [x] HUD 展示 workflow / assignment / mailbox / ledger。
- [x] SSE 刷新 assignment/mailbox/room/message。

## P6 结构化 Agent 输出协议
- [x] 结构化结果协议与后端解析。
- [x] 公开消息剥离控制块。

## P7 HUD 结构化结果与人工动作
- [x] 结构化结果在 HUD 展示。
- [x] HUD 支持任务状态修正与 mailbox 已读。
- [x] `src/compat/dsh.ts`。
- [x] `npm run test:matrix`。
- [x] HUD 展示 workflow / assignment / mailbox / ledger。
- [x] 结构化结果协议与 HUD 展示。

## P8 HUD 布局保护
- [x] HUD 覆盖停靠，不挤压官方 AppFrame。
- [x] `Agent 群聊` 自身避让 HUD。
- [x] 修复中间输入区左右间距不一致。
- [x] 修复右栏文本溢出。

## P9 HUD 可拖动浮窗与可缩放
- [x] HUD 可浮动/停靠。
- [x] HUD 左边线可缩放。
- [x] 缩放使用 Pointer Events + Pointer Capture。
- [x] HUD 覆盖停靠，不挤压官方 AppFrame。
- [x] `Agent 群聊` 自身避让 HUD。
- [x] HUD 可浮动/停靠。
- [x] HUD 左边线可缩放。
- [x] 缩放使用 Pointer Events + Pointer Capture。
- [x] 修复中间输入区左右间距不一致。
- [x] 修复右栏文本溢出。

## P10 小任务端到端测试
- [x] 无 LLM 小任务 E2E。

## P11-P17 产品闭环
- [x] 无 LLM 小任务 E2E。
- [x] 发布预检。
- [x] 官方对话兼容修复。
- [x] `Agent 群聊` 安全中间标签。
- [x] 一句话自动建群/工作流草案。
- [x] 草案确认后写入工作区。
- [x] 默认沙雕主题与趣味文案。
- [x] HUD 执行导演台。

## P18 UI 稳定性与文档同步

- [x] AGENTS.md 更新最近踩坑：prepare、官方对话兼容、HUD 覆盖、插件作用域避让、Pointer Capture、文本防溢出、工作区作用域。
- [x] 顶层文档重写为匹配当前项目状态。
- [x] 新增 `Docs/README.md` 文档索引。
- [x] `Docs/p8-hud-overlay-layout/README.md` 连续记录布局/拖拽/溢出回归修复。
- [x] 增加浏览器端自动化视觉回归：左栏展开 + HUD 展开 + 输入框间距 + HUD 溢出扫描。
- [x] 将 HUD 顶部配置区抽成独立组件，减少 inline style 和重复布局风险。

## 下一步 P19：真实项目闭环

- [x] 选择一个小型真实代码任务，用扩展自己跑完整协作。
- [x] 验证 researcher/backend/frontend/qa/writer 的工具路由不重复。
- [x] 强化主 Agent 汇总 mailbox 的可读性。
- [x] 失败任务支持一键重试/请求用户补充/跳过。

## 下一步 P20：低理解成本体验

- [x] 首次进入 `Agent 群聊` 显示 3 步引导。
- [x] 调度模式 QA 改为上下文说明：当前模式、适合任务、会触发谁。
- [x] 新增常见项目模板：修 Bug、做 UI、写文档、调研、发布前检查。

## 下一步 P21：HUD 顶部配置区组件化

- [x] `GroupChatHudTopControls` 承接角色主题、调度模式与 QA 弹窗。
- [x] 保留一行紧凑布局与 SVG 下拉箭头。
- [x] P8/P21 回归覆盖组件化后的布局红线。


## 下一步 P22：HUD 工作流面板组件化

- [x] `GroupChatHudWorkflowPanel` 承接执行导演台、阶段流程、任务卡、Assignment 与 Mailbox。
- [x] 保留失败任务快捷动作：重试 / 让用户补充 / 跳过。
- [x] P5/P7/P22 回归覆盖组件化后的 HUD 执行态。

## 下一步 P23：HUD 账本 / 角色 / 主题面板组件化

- [x] `GroupChatHudRosterPanel` 承接主题生成、运行账本、成员列表、Assignment 与 Mailbox 摘要。
- [x] `GroupChatSideDock` 账本标签改为组件委托，降低右侧 HUD 壳层复杂度。
- [x] P23 回归覆盖账本标记、AvatarBadge、主题草案确认与指标摘要。

## 下一步 P24：HUD 黑板面板组件化

- [x] `GroupChatHudScratchpadPanel` 承接黑板展示、编辑、保存与空态提示。
- [x] `GroupChatSideDock` 黑板标签改为组件委托，HUD 三个主标签均完成组件化。
- [x] P24 回归覆盖黑板标记、编辑态、展示态与防横向溢出。

## 下一步 P25：SideDock 冗余类型与工具函数清理

- [x] 账本/邮箱/分派类型从 `GroupChatHudRosterPanel` 复用导出。
- [x] `GroupChatSideDock` 删除已迁移到子组件的指标、颜色、短 ID helper。
- [x] P25 回归覆盖 SideDock 壳层化与类型去重。

## 下一步 P26：HUD 共享类型文件

- [x] 新增 `group-chat-hud-types.ts` 承接 HUD 共享数据类型。
- [x] `SideDock` / `RosterPanel` / `WorkflowPanel` 统一从共享类型文件导入。
- [x] P26 回归覆盖组件间类型解耦。

## 下一步 P27：HUD 公共样式 Token

- [x] 新增 `group-chat-hud-styles.ts` 承接 HUD 通用 token、卡片、按钮、textarea、滚动文本样式。
- [x] `GroupChatHudScratchpadPanel` 接入共享样式，作为后续批量美化的样板。
- [x] P27 回归覆盖官方主题变量与黑板防溢出策略。

## 剩余收敛 TODO（目标：一次性走向可用版）

> 当前判断还剩约 4 个收敛阶段；不是无限加功能，优先把已实现能力稳定成用户可用版。

1. **P28 账本/角色面板样式接入公共 token**：减少按钮、卡片、输入框重复 inline style，继续贴近官方主题。
2. **P29 工作流面板样式接入公共 token**：统一任务卡、状态按钮、Assignment/Mailbox 卡片，重点防止右栏文本溢出回潮。
3. **P30 顶部控件样式接入公共 token**：统一下拉、QA 弹窗、帮助按钮，并保留一行布局。
4. **P31 最终可用性验收**：用浏览器回归 + 小任务 E2E 验证官方对话、Agent 群聊、HUD、工作区隔离、主题/模型/工作流闭环。


## 下一步 P29：工作流面板样式 Token 化

- [x] GroupChatHudWorkflowPanel 接入公共 HUD 样式 token。
- [x] 保留执行导演台、失败任务快捷处理、Assignment 与 Mailbox 展示。


## 下一步 P30：顶部控件样式 Token 化

- [x] GroupChatHudTopControls 接入公共 HUD token。
- [x] 保留一行紧凑布局、SVG 下拉箭头与调度模式 QA。



## 下一步 P31：最终可用性总验收

- [x] 记录当前可用版完成度与剩余阶段为 0。
- [x] 总验收覆盖官方对话兼容、Agent 群聊、HUD、主/子 Agent、工作区隔离、样式 token 与文档守则。



## P32：工作流面板渐进式展示

- [x] 默认只展示执行导演台、核心数字、当前阶段、当前任务。
- [x] 阶段明细、Assignment、Mailbox、结构化结果、失败处理移动到默认折叠的高级详情。
- [x] P32 回归覆盖清爽默认与高级能力保留。



## P33：工作流清爽默认态浏览器验收

- [x] 将右栏信息密度问题写入专项 TODO。
- [x] 新增浏览器 DOM 回归，验证高级详情默认折叠。
- [x] 默认态只保留执行导演台、核心计数、当前阶段、当前任务和高级详情入口。



## P34：工作流高级详情手风琴折叠

- [x] 高级详情内部折叠区改成展开一个、收起其他。
- [x] 阶段、Assignment、Mailbox 进入同一个手风琴组。
- [x] P34 回归覆盖手风琴状态与高级能力保留。



## P35：团队 / 工作流 / 黑板 / 账本标签重组

- [x] 右侧 HUD 标签改为团队 / 工作流 / 黑板 / 账本。
- [x] 角色主题生成、成员列表、角色编辑归入团队。
- [x] 账本只显示统计、Agent/模型记录、完整 Assignment 与完整 Mailbox。



## P36：账本完整流水渐进式展示

- [x] 账本新增完整流水摘要：分派、邮箱、未读数量。
- [x] 完整 Assignment / Mailbox 保留全量数据源，默认折叠展示。
- [x] 新增搜索与全部 / 进行中 / 未读筛选，降低信息密度。


## P37：团队页渐进式管理

- [x] 团队页默认展示摘要、主 Agent 与成员总数。
- [x] 团队页新增成员搜索，支持角色、职责、Provider、模型 ID。
- [x] 主题角色与工作流生成入口收进 `造人/造工作流工具箱` 折叠区。


## P38：官方源对话页保护

- [x] HUD 只在 `Agent 群聊` 标签激活时渲染。
- [x] 官方 `对话` / `新会话` 页面不显示群聊副屏、不保留群聊输入控件。
- [x] HUD 展开态 body 标记限定在扩展标签生命周期内。



## P39：源版对话 / Agent 群聊切换回归

- [x] 新增真实浏览器回归，覆盖 `新会话 -> Agent 群聊 -> 对话` 的来回切换。
- [x] 验证源版页面不出现 HUD、不保留扩展 body 标记、不残留群聊中间视图。
- [x] 验证 Agent 群聊标签仍能正常显示中间视图与 `团队 / 工作流 / 黑板 / 账本` HUD。
- [x] 新增 `npm run test:ui:switch`，并接入 `npm run test:matrix`。


## P40：刷新 / 重载后的扩展状态清理回归

- [x] 新增真实浏览器回归，覆盖 `Agent 群聊 -> 刷新 -> 新会话 -> Agent 群聊`。
- [x] 验证刷新后源版新会话不继承 HUD、群聊视图和扩展 body 标记。
- [x] 验证刷新后返回 Agent 群聊仍能恢复 HUD 与中间视图。
- [x] 新增 `npm run test:ui:refresh`，并接入 `npm run test:matrix`。


## P41：发布预检与维护守则补齐

- [x] 发布预检纳入 P39/P40 文档与测试脚本。
- [x] 发布预检纳入 `test:ui:visual`、`test:ui:switch`、`test:ui:refresh`。
- [x] AGENTS.md 追加源版对话 / Agent 群聊切换、刷新状态清理与历史错误防线。


## P42：Agent 群聊真实入口可用性回归

- [x] 新增真实浏览器回归，验证用户从官方页进入 `Agent 群聊` 后能看到中间对话、输入框、友好入口文案与 HUD。
- [x] 验证 HUD 四标签为 `团队 / 工作流 / 黑板 / 账本`，工作流默认态保持清爽。
- [x] 验证不出现旧标签 `特遣协同 / 特遣监控室`，且 HUD 无横向溢出。
- [x] 新增 `npm run test:ui:entry`，并接入 `npm run test:matrix`。


## P43：最终收口审计

- [x] 全量扫描旧 TODO / roadmap / 文档索引 / 发布预检。
- [x] 将旧路线图中实际已完成的 `[ ]` 更新为 P18-P42 完成事实。
- [x] 明确当前可用版阻塞项为 0，剩余项归为非阻塞优化，不再无限下一步。
- [x] 新增 P43 收口文档与测试脚本。


## P44：源版「对话」prepare 报错诊断

- [x] 确认本插件 `Agent 群聊` 中间标签自带 `prepare()`，并未覆盖官方「对话」。
- [x] 定位 DSH 后端 agent-loop 的 `ctx.tools[TOOL_RUNTIME_SCHEDULER].prepare(call.exec)` 为当前报错匹配点。
- [x] 记录全局 DSH 存在多份 `@deepseek-ai/dsh-tools`，可能触发 Symbol 不一致导致 scheduler 为 undefined。
- [x] 给出不改 DSH 核心源码的修复方向：preload singleton 化 `@deepseek-ai/dsh-tools` 并做 A/B 验证。


## P44 追加：dsh-tools singleton 运行时修复验证

- [x] 备份 `Docs/scope-repair/scope-singleton.mjs`。
- [x] 将 `@deepseek-ai/dsh-tools` 及常用子路径加入 preload singleton，避免工具调度器 Symbol 多副本。
- [x] 重启 `dsh web --no-open` 并验证 `/dsh-group-chat/api/compat` 为 200。
- [x] 重新注入本插件并确认 super-injector 返回 host/client ✓、active=true。
- [x] 记录中文路径 POST 的 PowerShell 编码坑，后续使用 Node fetch 发送 UTF-8 JSON。


## P45：中间对话区主题化人话文案

- [x] 中间 `Agent 群聊` 空状态标题、副标题跟随当前角色主题。
- [x] 三步引导与快捷任务模板按沙雕、三国、原神主题切换。
- [x] Agent 状态悬浮窗 idle/running/complete/error 文案跟随主题。
- [x] 自动创建角色/工作流草案、确认、取消系统消息传入 `room.activeTheme`。
- [x] 主题切换工具支持 `default / meme_comedy / genshin / modern / three_kingdoms / legends`。


## P46：群聊面板中英文业务功能开发任务实测

- [x] 通过群聊面板/API 投递中英文语言业务功能开发任务。
- [x] 验证自动配置助手生成待确认角色 + 工作流草案，确认前不写入。
- [x] 浏览器验证中间面板、HUD、草案、确认按钮、zh-CN/en-US 内容、无溢出、无历史 prepare 错误。
- [x] 修复自动角色名错误截取任务开头的问题，i18n 类任务改为生成 `双语总控官 / 双语门面官` 等业务化名称。

## P47 已完成：中/英文业务文案真实开发与 Chrome 监控

- [x] 新增轻量 i18n 层 `src/client/i18n.ts`。
- [x] 中央 `Agent 群聊` 首屏、快捷模板、输入区、Agent 状态浮窗支持 zh-CN/en-US。
- [x] HUD 主题/模式/语言、团队/工作流/黑板/账本核心文案支持 zh-CN/en-US。
- [x] Chrome 实测中文/英文切换，控制台错误为 0。
- [x] 修复旧工具名 `workflow_advance_stage` / `workflow_reject_stage` 对真实 Agent 调用的阻断。
- [ ] 下一阶段：把 host API/tool 返回文案也抽成 locale-aware 字典，并把用户自定义角色数据与 UI 文案分层展示。

## P48 — 真实多 Agent 闭环质量验收
- [x] HUD 增加闭环质量卡，区分待验证/待收口/闭环通过/未完成。
- [x] 固化主 Agent 分派、SubAgent 执行、Mailbox 上报、主 Agent 读取的无 LLM 验收。
- [x] 将真实 Chrome 模型超时归类为质量未完成，避免把进入调用误判为任务成功。


## P49 — 群聊 Agent 超时误判修正
- [x] 修正结论：free 模型官方对话可用时，群聊失败优先按插件超时/上下文链路诊断。
- [x] 按角色 latencyPreference 提高有效超时下限，避免 30 秒过早取消独立 Agent turn。
- [x] 失败信息增加总耗时和尝试次数，成功日志记录实际模型与耗时。


## P50 — 真实 moderator-led 多 Agent 闭环测试
- [x] 真实验证 commander -> researcher -> commander。
- [x] 验证 SubAgent mailbox 上报主 Agent。
- [x] 测试后恢复 workflow_driven。
- [ ] 后续优化：多人真实链路约 240 秒，需做快速/长链路分层与更强进度展示。


## P51 — 快速任务 / 长任务分层与进度展示
- [x] 输入区新增快活/长活切换，默认快速任务。
- [x] 快速任务限制 fan-out：有 @ 只叫被点名角色，没 @ 只叫主 Agent。
- [x] 长任务保留 workflow_driven、多 Agent 并发和上报链路。
- [x] Agent 状态浮窗展示快/长层级、已耗时/预计耗时和进度条。


- [ ] P52 follow-up：补齐群聊 messages 持久化，避免热重载后 assignment 保留但消息流为空，影响 Agent 群聊复盘。

- [x] P53：群聊 room/messages/ledger 快照持久化，修复热重载后 assignment 与消息流复盘断层。

- [x] P54：重启/热重载后将遗留 queued/running assignment 标记为 runtime-interrupted，避免 UI 永久显示运行中。

- [x] P55：导出纪要/API/工具支持 zh-CN/en-US，补齐账本与纪要字段英文文案。
- [x] P56：中央 Agent 群聊自动建群/工作流运行态提示、确认按钮与系统回执支持 zh-CN/en-US。
- [x] P57：Agent 真实轮次的系统提示、上下文投影、Tool Scope 与 followup 指令支持 zh-CN/en-US。
- [x] P58：群聊工具输出与 workflow/task/action API 结果支持 zh-CN/en-US，默认中文兼容旧调用。
- [x] P59：主题角色名/title/口头禅/systemPrompt 与工作流 title/stage/description 生成内容支持 zh-CN/en-US。

## P60：科技传奇主题
- [x] 将 `legends` 从泛名人“现代传奇”调整为科技巨头“科技传奇”。
- [x] 成员映射为乔布斯、马斯克、黄仁勋、雷布斯、比尔·盖茨、张小龙。
- [x] 补充 @ 马斯克 / 雷布斯 / 雷军 / 黄仁勋 / 盖茨 / 张小龙等别名。
- [x] 前端下拉、工具输出、回归矩阵和发布预检同步。

## P61：源码英文注释与运行态双语
- [x] 将 src 下中文注释英文化，方便开源阅读。
- [x] 保留用户可见 zh-CN 文案、中文 @ 别名和主题角色名，不误删本地化能力。
- [x] 增加注释扫描回归，确保后续新增源码注释优先英文。
- [x] 验证客户端自动语言识别、服务端 locale 分支、主题/工作流双语生成仍存在。

## 提交前文档同步
- [x] README 同步 P60/P61 当前能力：科技传奇、双语自动匹配、源码英文注释。
- [x] Docs 索引同步 P0-P61 当前状态与最近矩阵结果。
- [x] 业务规约同步双语/开源边界：源码英文不等于运行态英文-only。
- [x] 角色主题规约同步科技传奇职责映射。
- [x] 提交前验证通过：`npm run test:matrix` => `TEST_MATRIX_EXIT:0`。

- [x] Git release checklist 已补充：记录当前非 Git 仓库状态、提交命令、忽略目录与 pre-push 验证。


- [x] README 默认改为英文，保留中文支持说明与 zh-CN/en-US 运行态能力说明。


- [x] 对标项目与 dsh-mnemon 共存说明已同步到 README、生态评估和扩展标准：DSH seam / Hermes / OpenClaw / dsh-mnemon。
