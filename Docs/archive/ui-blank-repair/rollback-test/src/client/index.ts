/**
 * @dsh-external/dsh-group-chat — Client 前端入口
 *
 * 挂载模式：
 * 1. conversation.view: 主视区全屏工作台 Tab（多 Agent 沉浸式状态机推演主战场 + 角色编辑与头像上传）
 * 2. shell.overlay: 右侧伴随监控副屏（Companion HUD：工作流拓扑 + 共享黑板 + 成员账本，不重叠主对话区）
 * 3. conversation.composer: 不注册官方 chain slot；由 layout-push.ts 的 CSS 在特遣协同激活时隐藏原生输入框
 */

import { createElement } from "react";
import { GroupChatPanel } from "./GroupChatPanel.js";
import { GroupChatSideDock } from "./GroupChatSideDock.js";
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
  // 一启动即预注入全套全局样式 (含推挤与隐藏规则)
  injectLayoutPushStyles();

  // 1. 主视区全屏工作台 Tab
  ctx.effect(() => {
    return ctx.slots.inject("conversation.view", () => {
      return ctx.slots.register(
        {
          name: "conversation.view",
          id: "dsh-group-chat",
          order: 20,
          label: () => "特遣协同",
          component: () => createElement(GroupChatPanel, { mode: "full" }),
        },
        GroupChatPanel,
      );
    });
  }, "dsh-group-chat: conversation.view panel");

  // 2. 右侧伴随监控副屏 (Companion HUD，绝不与主界面重叠)
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
  }, "dsh-group-chat: layout-push side dock");
}
