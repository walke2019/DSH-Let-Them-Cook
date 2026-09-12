# P97 — 作战室驾驶舱导航强化与中央区双输入框去重 (War Room Cockpit & Composer Deconfliction)

## 概述与痛点分析

在多 Agent 协同体系中，人类负责人反馈了两个极其关键的交互痛点：
1. **作战室切换 / 找回任务入口不显眼**：原先仅收敛在右侧 HUD 小字副标题中，在中央大视口没有导航，导致跨作战室切换与找回未完成任务极其困难；
2. **中央区下方存在“两个输入框”视觉车祸**：进入 `Agent 群聊` 标签页后，DSH 原生会话框架常驻底座的官方 Composer（`[data-composer-seat]`）与群聊专用的多 Agent 调度输入框（`.gc-chat-bottom`）重叠出现，挤压视口并造成操作困惑。

## 核心技术实现

1. **中央区顶层作战室驾驶舱导航条 (`GroupChatWarRoomBar.tsx`)**：
   - 常驻在中央对话流上方，提供毛玻璃拟态的顶栏；
   - 展现当前作战室名称、默认标识与实时任务徽标（`🔥 x 任务全力开整中` / `🟢 待命中`）；
   - 提供极具视觉高反差的 `[ 🏛️ 切换作战室 / 找回任务 ▾ ]` 胶囊按钮；
   - 点击呼出作战室管理抽屉，优先按活跃任务数排序，直观展现各房间任务进展并支持一键无感切换与自动跟随当前会话。

2. **右侧 HUD 顶部作战室卡片 (`GroupChatSideDock.tsx`)**：
   - 在 HUD 标题栏下方常驻醒目的 `dsh-gc-hud-warroom-card`；
   - 提供当前作战室名称、活跃任务红色角标与切换按钮。

3. **双输入框去重与安全隔离 (`GroupChatConversationTab.tsx`)**：
   - 当挂载 `Agent 群聊` 视图时，在动态作用域生效：
     ```css
     body[data-dsh-group-chat-tab-active="true"] [data-composer-seat] {
       display: none !important;
     }
     ```
   - 彻底隐藏重复的官方输入框，使群聊视图保持单一、专业的 Agent 输入框；
   - 当用户切回官方原生“对话”或“轨迹”标签时，`data-dsh-group-chat-tab-active` 属性立即被卸载清理，官方输入框 100% 无缝恢复。

4. **严格遵守零污染红线 (`layout-push.ts`)**：
   - 保持全局 `layout-push.ts` 零污染，绝不向全局 DOM 注入 host 选择器。

## 自动化测试与验证

* 单测套件：`__tests__/test-p97-war-room-nav-and-composer-deconfliction.cjs`
* 覆盖矩阵：`npm run test:war-room-nav`、`npm run test:matrix`、`npm run preflight` 全量通过。
