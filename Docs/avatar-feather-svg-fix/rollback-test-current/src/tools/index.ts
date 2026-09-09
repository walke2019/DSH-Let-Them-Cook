/**
 * DSH Group Chat - 群聊工具定义 (Agent Tools Surface)
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { RoomManager } from '../engine/room-manager.js'
import { DispatchArbiter } from '../engine/arbiter.js'
import { ContextProjection } from '../engine/projection.js'
import { WorkflowOrchestrator } from '../engine/workflow-orchestrator.js'
import type { DispatchMode, PersonaThemeKey } from '../types.js'

export function registerGroupChatTools(
  roomManager: RoomManager,
  onTriggerAgentTurn?: (roomId: string, targetAgentId: string) => Promise<void>
) {
  return [
    defineTool({
      name: 'group_chat_send_message',
      description: '向多 Agent 群聊房间发送一条消息，支持 @ 唤醒特定成员或 @全员争鸣。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID（缺省为当前默认房间）' },
        content: { type: 'string', required: true, description: '消息正文内容，可包含 @架构师、@开发 等' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
      },
      async execute(args: { roomId?: string; content: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const room = roomManager.getRoom(roomId)
        if (!room) return `错误：群聊房间 ${roomId} 不存在。`

        const { targetAgentIds } = DispatchArbiter.extractMentions(args.content, room.members)

        const envelope = roomManager.addMessage(roomId, {
          roomId,
          sender: {
            kind: 'user',
            id: 'user',
            name: '人类负责人',
            avatar: '👤',
          },
          content: args.content,
          mentions: targetAgentIds,
          metadata: {},
        })

        roomManager.resetInteractionRound(roomId)
        const decision = DispatchArbiter.decideNextSpeakers(room, envelope)

        if (decision.isTerminal || decision.nextSpeakerIds.length === 0) {
          return `消息已发送至群聊 [${room.title}]。\n调度仲裁：${decision.reason}`
        }

        if (onTriggerAgentTurn) {
          for (const targetId of decision.nextSpeakerIds) {
            void onTriggerAgentTurn(roomId, targetId).catch(err => {
              console.error(`[GroupChat] Trigger agent ${targetId} failed:`, err)
            })
          }
        }

        return `消息已发送至群聊 [${room.title}]。\n唤醒成员: [${decision.nextSpeakerIds.join(', ')}]\n依据: ${decision.reason}`
      },
    }),

    defineTool({
      name: 'group_chat_switch_theme',
      description: '一键切换群聊智能体名号映射主题（modern 现代经典 / three_kingdoms 三国风云 / legends 现代传奇）。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID' },
        theme: { type: 'string', required: true, description: '主题: modern | three_kingdoms | legends' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
      },
      async execute(args: { roomId?: string; theme: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const theme = args.theme as PersonaThemeKey
        if (!['modern', 'three_kingdoms', 'legends'].includes(theme)) {
          return `错误：不支持的主题 ${theme}，可选值：modern, three_kingdoms, legends`
        }

        const room = roomManager.switchTheme(roomId, theme)
        if (!room) return `错误：房间 ${roomId} 不存在。`

        const list = room.members.map(m => `- ${m.avatar} **${m.name}** (\`@${m.id}\`, ${m.title || ''})`)
        return `✅ 智能体名号主题已切换为【${theme === 'three_kingdoms' ? '三国风云' : theme === 'legends' ? '现代传奇' : '现代经典'}】！当前名册：\n${list.join('\n')}`
      },
    }),

    defineTool({
      name: 'group_chat_workflow_advance',
      description: '工作流推进：总指挥官审核通过当前阶段成果，并将工作流流转至下一阶段。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID' },
        approverRoleId: { type: 'string', description: '审批人角色 ID（默认 commander）' },
        summary: { type: 'string', description: '阶段产物与审核通过意见' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
      },
      async execute(args: { roomId?: string; approverRoleId?: string; summary?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const room = roomManager.getRoom(roomId)
        if (!room) return `错误：房间 ${roomId} 不存在。`

        const approver = args.approverRoleId || 'commander'
        const result = WorkflowOrchestrator.advanceStage(room, approver, args.summary)

        if (!result.success) {
          return `⚠️ 审批失败: ${result.message}`
        }

        roomManager.saveRoom(room)

        // 自动触发新阶段负责成员
        if (result.stage && onTriggerAgentTurn) {
          for (const nextRole of result.stage.assignedRoleIds) {
            void onTriggerAgentTurn(roomId, nextRole).catch(console.error)
          }
        }

        return `🎉 ${result.message}`
      },
    }),

    defineTool({
      name: 'group_chat_workflow_reject',
      description: '工作流驳回：总指挥官打回当前阶段产物，提出修改意见并责令整改。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID' },
        reason: { type: 'string', required: true, description: '打回驳回具体原因与整改意见' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
      },
      async execute(args: { roomId?: string; reason: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const room = roomManager.getRoom(roomId)
        if (!room) return `错误：房间 ${roomId} 不存在。`

        const result = WorkflowOrchestrator.rejectStage(room, 'commander', args.reason)
        roomManager.saveRoom(room)

        return result.message
      },
    }),

    defineTool({
      name: 'group_chat_room_status',
      description: '查询群聊房间实时状态、当前名号主题、成员花名册、工作流阶段与 Token 记账。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID（缺省为默认房间）' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
      },
      async execute(args: { roomId?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const room = roomManager.getRoom(roomId)
        if (!room) return `错误：群聊房间 ${roomId} 不存在。`

        const messages = roomManager.getMessages(roomId)
        const ledger = roomManager.getLedger(roomId)

        const summary = [
          `=== 🏠 群聊房间: ${room.title} (ID: ${room.roomId}) ===`,
          `当前主题: ${room.activeTheme} | 调度模式: ${room.dispatchMode} | 互动轮次: ${room.interactionRound}/${room.safetyPolicy.maxTurnsPerPrompt}`,
          `群成员数: ${room.members.length} 人 | 消息总数: ${messages.length} 条`,
        ]

        if (room.workflow) {
          const curr = room.workflow.stages[room.workflow.currentStageIndex]
          summary.push(`当前工作流: [${room.workflow.title}] -> 当前处于 [${curr?.name || '已完结'}] (责任人: ${curr?.assignedRoleIds.join(', ') || '无'})`)
        }

        summary.push(
          '',
          `【成员名册】\n${ContextProjection.formatRoster(room.members)}`,
          '',
          `【共享黑板】\n${room.scratchpad || '(暂无内容)'}`,
        )

        if (ledger && ledger.totalCalls > 0) {
          summary.push('', `【Token 账本】累计调用: ${ledger.totalCalls} 次, 消耗: ${ledger.totalTokens} Tokens`)
        }

        return summary.join('\n')
      },
    }),

    defineTool({
      name: 'group_chat_update_scratchpad',
      description: '更新群聊共享黑板 (Shared Scratchpad)，沉淀阶段性共识与技术选型决策（仅限总指挥官或文案写手）。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID' },
        operatorRoleId: { type: 'string', description: '操作人角色 ID（默认 commander）' },
        scratchpad: { type: 'string', required: true, description: '新的 Markdown 备忘录文本' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
      },
      async execute(args: { roomId?: string; operatorRoleId?: string; scratchpad: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const operator = args.operatorRoleId || 'commander'
        const result = roomManager.updateScratchpad(roomId, args.scratchpad, operator)
        if (!result.success) return result.message
        return `共享黑板已更新！当前内容预览：\n${args.scratchpad.slice(0, 150)}...`
      },
    }),

    defineTool({
      name: 'group_chat_set_mode',
      description: '切换群聊发言调度模式（mention_only / moderator_led / workflow_driven / free_discussion）。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID' },
        mode: { type: 'string', required: true, description: '模式: mention_only | moderator_led | workflow_driven | free_discussion' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
      },
      async execute(args: { roomId?: string; mode: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const mode = args.mode as DispatchMode
        if (!['mention_only', 'moderator_led', 'workflow_driven', 'free_discussion'].includes(mode)) {
          return `错误：无效的调度模式 ${args.mode}，可选：mention_only, moderator_led, workflow_driven, free_discussion`
        }
        const updated = roomManager.setDispatchMode(roomId, mode)
        if (!updated) return `错误：群聊房间 ${roomId} 不存在。`
        return `群聊 [${updated.title}] 调度模式已切换为: ${mode}`
      },
    }),

    defineTool({
      name: 'group_chat_export_summary',
      description: '导出群聊协作讨论纪要、工作流流转过程与消耗账本（Markdown 格式）。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
      },
      async execute(args: { roomId?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        return roomManager.exportMeetingSummary(roomId)
      },
    }),
  ]
}
