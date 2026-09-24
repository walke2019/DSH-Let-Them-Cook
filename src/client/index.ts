import { disposeGroupChatEvents } from './group-chat-events.js';
import { GroupChatSideDock } from "./GroupChatSideDock.js";
import { GroupChatApprovalDetail } from "./GroupChatApprovalDetail.js";
import { setActiveSessionId } from "./current-room.js";

export interface ClientContext {
  slots: {
    inject(slotName: string, callback: () => unknown): () => void;
    register(meta: Record<string, unknown>, component?: unknown): unknown;
  };
  sidebarRight: { openTab(kind: string, options?: Record<string, unknown>): void };
  sidebarRightTabs: { register(definition: Record<string, unknown>): () => void };
  sessions: {
    list: {
      getSnapshot(): { current?: string };
      subscribe(fn: () => void): () => void;
    };
  };
  get?(name: string): unknown;
  effect(callback: () => unknown, label?: string): void;
}

export const inject = ["slots", "sessions", "sidebarRight", "sidebarRightTabs"];

export function apply(ctx: ClientContext): void {
  ctx.effect(()=>()=>disposeGroupChatEvents(), "dsh-group-chat: events");
  // Sync active DSH session from the native sessions service only.
  const sessionsService = ctx.sessions;
  const syncSession = () => {
    const snap = sessionsService.list.getSnapshot();
    setActiveSessionId(snap.current || "");
  };
  syncSession();
  ctx.effect(() => sessionsService.list.subscribe(syncSession), "dsh-group-chat: native session watch");

  // Native DSH rightbar tab: the host owns docking, width, fullscreen, and session scope.
  ctx.effect(() => {
    const disposeType = ctx.sidebarRightTabs.register({
      id: "@dsh-external/dsh-let-them-cook",
      kind: "let-them-cook",
      priority: "extension",
      title: () => "Agent 群聊",
      guide: [{order: 100, title: () => "Agent 群聊", description: () => "开整天团会话控制台"}],
    });
    const disposeBody = ctx.slots.inject("sidebar.right.pane.tab", () => ctx.slots.register({
      name: "sidebar.right.pane.tab",
      key: "@dsh-external/dsh-let-them-cook",
    }, GroupChatSideDock));
    const disposeTitle = ctx.slots.inject("sidebar.right.pane.tab.title", () => ctx.slots.register({
      name: "sidebar.right.pane.tab.title",
      key: "@dsh-external/dsh-let-them-cook",
    }, () => "Agent 群聊"));
    return () => {
      disposeTitle();
      disposeBody();
      disposeType();
    };
  }, "dsh-group-chat: native rightbar tab");
}
