/**
 * DSH Group Chat - Layout Push 样式引擎
 * 参考 dsh-better-sidebar 工业级实现：
 * 通过 padding-right 真实推挤 DSH 的 AppFrame 栅格系统，
 * 使得主对话区、原生 Composer 打字输入框、右侧详情栏与滚动条自适应向左收缩，
 * 彻底杜绝遮挡、覆盖或丢失原生页面元素！
 */

export const LAYOUT_PUSH_CSS = `
/* 1. 给 DSH AppFrame 注入 padding-right，物理推挤主视窗，保持原生输入框和聊天流完好 */
#root [data-dsh-frame],
#root > [data-slot="root"] > div {
  box-sizing: border-box !important;
  padding-right: var(--dsh-group-chat-width, 0px) !important;
  transition: padding-right var(--ds-transition-duration-slow, 0.25s) var(--ds-ease-in-out, cubic-bezier(0.4, 0, 0.2, 1)) !important;
}

/* 2. details 栏（若有开启）自适应向左平移 */
#root [data-dsh-frame] > [data-side="details"],
#root > [data-slot="root"] > div > [data-side="details"] {
  transform: translateX(calc(0px - var(--dsh-group-chat-width, 0px))) !important;
  transition: transform var(--ds-transition-duration-slow, 0.25s) var(--ds-ease-in-out, cubic-bezier(0.4, 0, 0.2, 1)) !important;
}

/* 3. 当用户进入全屏“特遣协同”视图时，彻底隐藏官方默认的打字框及其包含的所有插件Notice（例如 Mnemon Notice 等），让工作台充满全屏 */
body[data-dsh-group-chat-active="true"] [data-composer-seat],
body[data-dsh-group-chat-active="true"] [data-composer-card],
body[data-dsh-group-chat-active="true"] [class*="composerSeat"],
body[data-dsh-group-chat-active="true"] [class*="composerCard"],
body[data-dsh-group-chat-active="true"] [data-slot*="conversation.composer"],
body[data-dsh-group-chat-active="true"] [class*="composerStack"],
body[data-dsh-group-chat-active="true"] [class*="uV2eYG_root"],
body[data-dsh-group-chat-active="true"] [class*="FJxK0a_root"],
body[data-dsh-group-chat-active="true"] [class*="uV2eYG_notice"],
body[data-dsh-group-chat-active="true"] div:has(> [data-composer-seat]),
body[data-dsh-group-chat-active="true"] div:has(> [data-composer-card]) {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  min-height: 0 !important;
  max-height: 0 !important;
  opacity: 0 !important;
  pointer-events: none !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}

body[data-dsh-group-chat-active="true"] [data-conversation-scroll] {
  height: 100% !important;
  max-height: 100% !important;
  overflow: hidden !important;
  padding-bottom: 0 !important;
}

body[data-dsh-group-chat-active="true"] [data-conversation-scroll] > div:first-child,
body[data-dsh-group-chat-active="true"] [class*="viewArea"] {
  height: 100% !important;
  max-height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  flex: 1 1 auto !important;
  overflow: hidden !important;
}

/* 4. 协同侧栏宿主容器 */
.dsh-gc-sidebar-host {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: var(--dsh-group-chat-width, 380px);
  height: 100vh;
  z-index: 50;
  background-color: var(--dsw-alias-bg-layer-1, #151518);
  border-left: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.1));
  box-shadow: var(--dsw-shadow-lv2, -2px 0 12px rgba(0, 0, 0, 0.25));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  transition: transform var(--ds-transition-duration-slow, 0.25s) var(--ds-ease-in-out, cubic-bezier(0.4, 0, 0.2, 1));
}

.dsh-gc-sidebar-host[data-collapsed="true"] {
  transform: translateX(100%);
  pointer-events: none;
}
`

export function injectLayoutPushStyles(): void {
  const tagId = 'dsh-group-chat/layout-push.css'
  if (typeof document !== 'undefined' && document.querySelector(`style[data-plugin-css="${tagId}"]`) === null) {
    const style = document.createElement('style')
    style.dataset.plugin = '@dsh-external/dsh-group-chat'
    style.dataset.pluginCss = tagId
    style.textContent = LAYOUT_PUSH_CSS
    document.head.appendChild(style)
  }
}

export function updateLayoutPushWidth(widthPx: number): void {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--dsh-group-chat-width', `${widthPx}px`)
  }
}
