# P85 角色名与全栈中/英双语无死角覆盖规范 (Full Bilingual Role Names & End-to-End Coverage)

## 一、 背景与痛点
虽然项目此前已初步支持了 `zh-CN / en-US` 的 UI 静态标签和部分提示词，但对于**核心智能体角色（Persona Roster）**：
1. `THEME_CATALOG` 中的全部 5 套内置主题角色（现代精英、三国风云、科技传奇、沙雕整活、原神提瓦特）此前只有中文名称（如 `史蒂夫·乔布斯`、`诸葛亮`、`阿尔法总指挥官`），缺少原生英文名；
2. 切换到 `en-US` 时，中央聊天消息气泡的发送者（Sender Name）、右侧 HUD 成员名册（Roster）、底部输入框 `@` 角色选择器（Composer Picker）依然显示纯中文角色名；
3. `@mention` 别名缺乏对应英文关键字（如 `@Steve Jobs`、`@Jensen Huang`、`@Bill Gates`），导致英文用户在群聊中呼叫角色时命中失败；
4. Prompt 投影 `formatRoster` 和 `exportMeetingSummary` 导出的花名册无法按语言自动下发对应角色定义。

## 二、 全链路改造实施

1. **底层数据契约扩展（Types & Themes Catalog）**：
   - `RoleThemeMapping` 与 `AgentProfile` 升级新增 `nameEn`、`titleEn`、`catchphraseEn`、`roleDescriptionEn`；
   - 为全部 5 大主题 30 个角色注入地道英文名与职能标签：
     - **科技传奇 (legends)**：`Steve Jobs` (Product Tyrant & Final Decision)、`Elon Musk` (First Principles & Intel Rocket)、`Jensen Huang` (Compute Godfather & Engine Architect)、`Lei Jun` (Showcase Polish & Value King)、`Bill Gates` (System Veteran & Compatibility Auditor)、`Allen Zhang` (Less Is More & Natural UX Voice)；
     - **现代精英 (modern)**：`Alpha Commander`、`Deep-dive Researcher`、`Core Backend Architect`、`Interaction & UI Designer`、`Red Team QA Auditor`、`Lead Tech Writer`；
     - **三国风云 (three_kingdoms)**：`Zhuge Liang (Kongming)`、`Sima Hui (Water Mirror)`、`Guan Yu (Yunchang)`、`Zhou Yu (Gongjin)`、`Wei Yan (Wenchang)`、`Chen Lin (Kongzhang)`；
     - **沙雕整活 (meme_comedy)** 与 **原神提瓦特 (genshin)** 全量补齐。

2. **客户端统一国际化映射 helper**：
   - `src/client/i18n.ts` 封装 `txRoleName`、`txRoleTitle`、`txRoleDesc`；
   - 保证中英界面下角色名平滑自适应，严禁破布局与字段缺失报错。

3. **中间对话区（GroupChatPanel）**：
   - 消息气泡的 Sender Label（`senderDisplayName`）、正在执行气泡（`memberName`）、复制提示全部自动根据用户语言输出对应语言角色名。

4. **输入框 @ 提及器（GroupChatComposer）**：
   - `@` 弹窗支持中英双语双向搜索（输入 `Jobs` 或 `乔布斯` 均能实时检索到）；
   - 点击选择后，按当前 locale 插入 `@Steve Jobs ` 或 `@史蒂夫·乔布斯 `。

5. **调度器与意图识别（DispatchArbiter）**：
   - 增加英文 alias 提取（如 `@steve jobs`、`@jensen huang`、`@elon musk`、`@lei jun`、`@bill gates` 等）；
   - 支持根据 `member.nameEn` 动态解析 @mention。

6. **右侧 HUD 控制台与报告导出**：
   - HUD 成员列表展示英文名与英文职位；
   - 执行导演台当前负责人动态展示对应语言名字；
   - `exportMeetingSummary` 与 `group_chat_export_summary` 工具输出标准双语花名册。

## 三、 回归测试
运行测试：
```bash
node docs/tasks/phases/p85-bilingual-role-coverage/test-p85-bilingual-role-coverage.cjs
```
