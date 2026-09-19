import { disposeGroupChatEvents } from './group-chat-events.js';
import { createElement } from 'react';
import { GroupChatSideDock } from "./GroupChatSideDock.js";
import { GroupChatConversationView } from "./GroupChatConversationTab.js";
import { injectLayoutPushStyles } from "./layout-push.js";

export interface ClientContext {
  slots: {
    inject(slotName: string, callback: () => unknown): () => void;
    register(meta: Record<string, unknown>, component?: unknown): unknown;
  };
  effect(callback: () => unknown, label?: string): void;
}

export const inject = ["slots"];

export function apply(ctx: ClientContext): void {
  ctx.effect(()=>()=>disposeGroupChatEvents(), "dsh-group-chat: events");
  ctx.effect(() => injectLayoutPushStyles(), "dsh-group-chat: styles");

  // Safe conversation view adapter without taking over the official chat
  ctx.effect(() => {
    return ctx.slots.inject("conversation.view", () => {
      return ctx.slots.register(
        {
          name: "conversation.view",
          id: "dsh-group-chat",
          order: 20,
          label: () => "Agent 群聊",
          prepare: GroupChatConversationView.prepare,
          component: () => createElement(GroupChatConversationView),
        },
        GroupChatConversationView,
      );
    });
  }, "dsh-group-chat: safe conversation view tab");


  // Source comment kept in English for open-source readability; user-facing copy stays localized at runtime.
  ctx.effect(() => {
    return ctx.slots.inject("shell.overlay", () => {
      return ctx.slots.register(
        {
          name: "shell.overlay",
          id: "dsh-group-chat-dock",
          order: 50,
        },
        GroupChatSideDock,
      );
    });
  }, "dsh-group-chat: hud overlay side dock");
}
