/**
 * HUD overlay style engine: keep the official center layout untouched and scope composer hiding to the Agent Chat tab.
 */

export const LAYOUT_PUSH_CSS = `
/* Zero-pollution rule: this stylesheet targets only plugin-owned roots and never hides/resizes DSH host internals. */

/* Companion sidebar host: lightweight overlay that does not alter the official layout flow. */
.dsh-gc-sidebar-host {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(var(--dsh-group-chat-width, 360px), calc(100vw - 72px));
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

.dsh-gc-sidebar-host[data-collapsed="false"] {
  transform: translateX(0);
}

.dsh-gc-sidebar-host[data-floating="true"] {
  border-radius: 14px;
  border: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12));
  box-shadow: var(--dsw-shadow-lv3, 0 20px 60px rgba(0, 0, 0, 0.45));
}

.gc-conversation-tab,
.gc-hero-main,
.gc-conversation {
  box-sizing: border-box;
}

`

export function injectLayoutPushStyles(): () => void {
  const tagId = 'dsh-group-chat/layout-push.css'
  if (typeof document !== 'undefined' && document.querySelector(`style[data-plugin-css="${tagId}"]`) === null) {
    const style = document.createElement('style')
    style.dataset.plugin = '@dsh-external/dsh-group-chat'
    style.dataset.pluginCss = tagId
    style.textContent = LAYOUT_PUSH_CSS
    document.head.appendChild(style)
    return () => style.remove()
  }
  return () => {}
}

export function updateLayoutPushWidth(widthPx: number): void {
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--dsh-group-chat-width', `${widthPx}px`)
  }
}
