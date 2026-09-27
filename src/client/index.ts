import { disposeGroupChatEvents } from "./group-chat-events.js";
import { GroupChatSideDock } from "./GroupChatSideDock.js";
import { setActiveSessionId } from "./current-room.js";

export interface ClientContext {
  slots: {
    inject(slotName: string, callback: () => unknown): () => void;
    register(meta: Record<string, unknown>, component?: unknown): unknown;
  };
  sidebarRightTabs: {
    register(definition: Record<string, unknown>): () => void;
  };
  sessions: {
    list: {
      getSnapshot(): { current?: string };
      subscribe(fn: () => void): () => void;
    };
  };
  get?(name: string): unknown;
  effect(callback: () => unknown, label?: string): void;
}

export const inject = ["slots", "sessions", "sidebarRightTabs"];

export function apply(ctx: ClientContext): void {
  ctx.effect(() => () => disposeGroupChatEvents(), "dsh-group-chat: events");

  // Sync active DSH session from the native sessions service only.
  const sessionsService = ctx.sessions;
  const syncSession = () => {
    const snap = sessionsService.list.getSnapshot();
    setActiveSessionId(snap.current || "");
  };
  syncSession();
  ctx.effect(
    () => sessionsService.list.subscribe(syncSession),
    "dsh-group-chat: native session watch",
  );

  // 右栏入口：只注册 tab 类型与面板内容，不主动 openTab。
  // dsh 0.1.5-rc.3 起 sidebarRight.openTab 在 session surface 未挂载时会抛错，
  // 而首次加载时 surface 必然尚未挂载，主动打开会导致整个插件加载失败。
  ctx.effect(() => {
    const disposeType = ctx.sidebarRightTabs.register({
      id: "@dsh-external/dsh-let-them-cook",
      kind: "let-them-cook",
      priority: "extension",
      title: () => "Agent 群聊",
      guide: [
        {
          order: 100,
          title: () => "Agent 群聊",
          description: () => "开整天团会话控制台",
        },
      ],
    });
    const disposeBody = ctx.slots.inject("sidebar.right.pane.tab", () =>
      ctx.slots.register(
        {
          name: "sidebar.right.pane.tab",
          key: "@dsh-external/dsh-let-them-cook",
        },
        GroupChatSideDock,
      ),
    );
    const disposeTitle = ctx.slots.inject("sidebar.right.pane.tab.title", () =>
      ctx.slots.register(
        {
          name: "sidebar.right.pane.tab.title",
          key: "@dsh-external/dsh-let-them-cook",
        },
        () => "Agent 群聊",
      ),
    );
    return () => {
      disposeTitle();
      disposeBody();
      disposeType();
    };
  }, "dsh-group-chat: native rightbar tab");
}
