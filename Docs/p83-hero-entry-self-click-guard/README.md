# P83 新会话 Agent 群聊入口自点击守卫

问题：官方新会话 blank hero 中，插件的 `Agent 群聊` 小入口也包含同名文案。入口点击时如果把自身误判为“真实 Agent 群聊标签”，会点击自己后提前返回，导致临时中央群聊面板没有打开，用户感觉对话区突然消失或入口失效。

修复：`clickVisibleGroupChatTab()` 只允许命中真实 tab/tablist 附近的 `Agent 群聊`，并显式排除 `.gc-input-entry-button`、`.gc-hero-button`、`data-dsh-group-chat-hero-entry` 和 HUD。没有真实标签时入口用自身 React 状态打开临时 `#dsh-group-chat-hero-main`；禁止用嵌套 `react-dom/client.createRoot()` 创建 detached root，避免 DSH slot renderer 报 `reading code` 后整块 overlay 消失。

验证：`npm run test:hero-entry-self-click-guard` 静态锁定排除规则和 fallback 行为；同时继续跑 `test:new-session-agent-entry`、`test:hero-left-collapse`、`test:ui:entry`。



