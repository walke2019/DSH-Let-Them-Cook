# P45 — 中间对话区主题化人话文案

## 目标

中央 `Agent 群聊` 对话区不再固定显示“沙雕整活”文案，而是跟随当前角色主题展示符合调性的空状态、三步引导、快捷任务模板和自动建队/建工作流系统消息。

## 已实现

- `GroupChatPanel` 从房间数据读取 `activeTheme`，并监听 `room:updated` 实时更新。
- 中间空状态标题、副标题跟随 `getThemeVoice(activeTheme)`。
- 三步引导按主题切换：
  - `meme_comedy/default`：轻松整活但靠谱；
  - `three_kingdoms`：军令、点将、出兵；
  - `genshin`：委托、组队、接取。
- 快捷模板按主题切换，例如三国主题显示“修城防 / 整军容 / 写军令 / 探敌情 / 出征前点卯”，原神主题显示“修委托 / 美化尘歌壶 / 冒险手册 / 开地图 / 出发前检查”。
- 左侧悬浮 `Agent 状态` 的 idle/running/complete/error 文案跟随主题。
- 自动创建角色/工作流草案、确认写入、取消创建的系统消息支持传入 `room.activeTheme`，不再硬编码沙雕主题。
- 工具 `group_chat_switch_theme` 支持 `default / meme_comedy / genshin / modern / three_kingdoms / legends`。

## 验收

- 切换到三国主题后，中央空状态包含“军帐已开，等你下令”。
- 切换到原神主题后，中央空状态包含“冒险委托板已打开”。
- 自动草案格式化函数不能硬编码 `getThemeVoice('meme_comedy')`。
- 构建与发布预检通过。
