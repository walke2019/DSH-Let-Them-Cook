/**
 * Agent tool surface for group-chat room, theme, scratchpad, workflow, and export actions.
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { RoomManager } from '../engine/room-manager.js'
import { DispatchArbiter } from '../engine/arbiter.js'
import { ContextProjection } from '../engine/projection.js'
import { WorkflowOrchestrator } from '../engine/workflow-orchestrator.js'
import type { DispatchMode, PersonaThemeKey } from '../types.js'
import type {GroupChatLocale} from '../client/i18n.js'

const normalizeToolLocale = (value?: string): GroupChatLocale => value === 'en-US' ? 'en-US' : 'zh-CN'

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
        locale: { type: 'string', description: '输出语言：zh-CN 或 en-US（默认 zh-CN）' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
      },
      async execute(args: { roomId?: string; content: string; locale?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const locale = normalizeToolLocale(args.locale)
        const room = roomManager.getRoom(roomId)
        if (!room) return locale === 'en-US' ? `Error: group chat room ${roomId} does not exist.` : `错误：群聊房间 ${roomId} 不存在。`

        const { targetAgentIds } = DispatchArbiter.extractMentions(args.content, room.members)

        const envelope = roomManager.addMessage(roomId, {
          roomId,
          sender: {
            kind: 'user',
            id: 'user',
            name: locale === 'en-US' ? 'Human lead' : '人类负责人',
            avatar: '👤',
          },
          content: args.content,
          mentions: targetAgentIds,
          metadata: { locale },
        })

        roomManager.resetInteractionRound(roomId)
        const decision = DispatchArbiter.decideNextSpeakers(room, envelope)

        if (decision.isTerminal || decision.nextSpeakerIds.length === 0) {
          return locale === 'en-US' ? `Message sent to group chat [${room.title}].\nDispatch decision: ${decision.reason}` : `消息已发送至群聊 [${room.title}]。\n调度仲裁：${decision.reason}`
        }

        if (onTriggerAgentTurn) {
          for (const targetId of decision.nextSpeakerIds) {
            void onTriggerAgentTurn(roomId, targetId).catch(err => {
              console.error(`[GroupChat] Trigger agent ${targetId} failed:`, err)
            })
          }
        }

        return locale === 'en-US' ? `Message sent to group chat [${room.title}].\nAwakened members: [${decision.nextSpeakerIds.join(', ')}]\nReason: ${decision.reason}` : `消息已发送至群聊 [${room.title}]。\n唤醒成员: [${decision.nextSpeakerIds.join(', ')}]\n依据: ${decision.reason}`
      },
    }),

    defineTool({
      name: 'group_chat_switch_theme',
      description: '一键切换群聊智能体名号映射主题（default 默认沙雕 / meme_comedy 沙雕整活 / genshin 原神提瓦特 / modern 现代经典 / three_kingdoms 三国风云 / legends 科技传奇）。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID' },
        theme: { type: 'string', required: true, description: '主题: default | meme_comedy | genshin | modern | three_kingdoms | legends' },
        locale: { type: 'string', description: '输出语言：zh-CN 或 en-US（默认 zh-CN）' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
      },
      async execute(args: { roomId?: string; theme: string; locale?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const locale = normalizeToolLocale(args.locale)
        const theme = (args.theme === 'default' ? 'meme_comedy' : args.theme) as PersonaThemeKey
        if (!['meme_comedy', 'genshin', 'modern', 'three_kingdoms', 'legends'].includes(theme)) {
          return locale === 'en-US' ? `Error: unsupported theme ${theme}. Options: default, meme_comedy, genshin, modern, three_kingdoms, legends` : `错误：不支持的主题 ${theme}，可选值：default, meme_comedy, genshin, modern, three_kingdoms, legends`
        }

        const room = roomManager.switchTheme(roomId, theme)
        if (!room) return locale === 'en-US' ? `Error: room ${roomId} does not exist.` : `错误：房间 ${roomId} 不存在。`

        const list = room.members.map(m => `- ${m.avatar} **${m.name}** (\`@${m.id}\`, ${m.title || ''})`)
        return locale === 'en-US' ? `✅ Agent persona theme switched to [${theme}]. Current roster:\n${list.join('\n')}` : `✅ 智能体名号主题已切换为【${theme === 'meme_comedy' ? '沙雕整活' : theme === 'genshin' ? '原神提瓦特' : theme === 'three_kingdoms' ? '三国风云' : theme === 'legends' ? '科技传奇' : '现代经典'}】！当前名册：\n${list.join('\n')}`
      },
    }),

    defineTool({
      name: 'group_chat_workflow_advance',
      description: '工作流推进：总指挥官审核通过当前阶段成果，并将工作流流转至下一阶段。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID' },
        approverRoleId: { type: 'string', description: '审批人角色 ID（默认 commander）' },
        summary: { type: 'string', description: '阶段产物与审核通过意见' },
        locale: { type: 'string', description: '输出语言：zh-CN 或 en-US（默认 zh-CN）' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
      },
      async execute(args: { roomId?: string; approverRoleId?: string; summary?: string; locale?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const locale = normalizeToolLocale(args.locale)
        const room = roomManager.getRoom(roomId)
        if (!room) return locale === 'en-US' ? `Error: room ${roomId} does not exist.` : `错误：房间 ${roomId} 不存在。`

        const approver = args.approverRoleId || 'commander'
        const result = WorkflowOrchestrator.advanceStage(room, approver, args.summary, locale)

        if (!result.success) {
          return locale === 'en-US' ? `⚠️ Approval failed: ${result.message}` : `⚠️ 审批失败: ${result.message}`
        }

        roomManager.saveRoom(room)

        // Agent tool surface for group-chat room, theme, scratchpad, workflow, and export actions.
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
        locale: { type: 'string', description: '输出语言：zh-CN 或 en-US（默认 zh-CN）' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
      },
      async execute(args: { roomId?: string; reason: string; locale?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const locale = normalizeToolLocale(args.locale)
        const room = roomManager.getRoom(roomId)
        if (!room) return locale === 'en-US' ? `Error: room ${roomId} does not exist.` : `错误：房间 ${roomId} 不存在。`

        const result = WorkflowOrchestrator.rejectStage(room, 'commander', args.reason, locale)
        roomManager.saveRoom(room)

        return result.message
      },
    }),

    defineTool({
      name: 'group_chat_room_status',
      description: '查询群聊房间实时状态、当前名号主题、成员花名册、工作流阶段与 Token 记账。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID（缺省为默认房间）' },
        locale: { type: 'string', description: '输出语言：zh-CN 或 en-US（默认 zh-CN）' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
      },
      async execute(args: { roomId?: string; locale?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const locale = normalizeToolLocale(args.locale)
        const room = roomManager.getRoom(roomId)
        if (!room) return locale === 'en-US' ? `Error: group chat room ${roomId} does not exist.` : `错误：群聊房间 ${roomId} 不存在。`

        const messages = roomManager.getMessages(roomId)
        const ledger = roomManager.getLedger(roomId)

        const summary = [
          locale === 'en-US' ? `=== 🏠 Group chat room: ${room.title} (ID: ${room.roomId}) ===` : `=== 🏠 群聊房间: ${room.title} (ID: ${room.roomId}) ===`,
          locale === 'en-US' ? `Theme: ${room.activeTheme} | Dispatch mode: ${room.dispatchMode} | Rounds: ${room.interactionRound}/${room.safetyPolicy.maxTurnsPerPrompt}` : `当前主题: ${room.activeTheme} | 调度模式: ${room.dispatchMode} | 互动轮次: ${room.interactionRound}/${room.safetyPolicy.maxTurnsPerPrompt}`,
          locale === 'en-US' ? `Members: ${room.members.length} | Messages: ${messages.length}` : `群成员数: ${room.members.length} 人 | 消息总数: ${messages.length} 条`,
        ]

        if (room.workflow) {
          const curr = room.workflow.stages[room.workflow.currentStageIndex]
          summary.push(locale === 'en-US' ? `Current workflow: [${room.workflow.title}] -> [${curr?.name || 'completed'}] (owners: ${curr?.assignedRoleIds.join(', ') || 'none'})` : `当前工作流: [${room.workflow.title}] -> 当前处于 [${curr?.name || '已完结'}] (责任人: ${curr?.assignedRoleIds.join(', ') || '无'})`)
        }

        summary.push(
          '',
          `${locale === 'en-US' ? '[Roster]' : '【成员名册】'}\n${ContextProjection.formatRoster(room.members, locale)}`,
          '',
          `${locale === 'en-US' ? '[Shared Scratchpad]' : '【共享黑板】'}\n${room.scratchpad || (locale === 'en-US' ? '(No content yet)' : '(暂无内容)')}`,
        )

        if (ledger && ledger.totalCalls > 0) {
          summary.push('', locale === 'en-US' ? `[Token Ledger] Total calls: ${ledger.totalCalls}, total tokens: ${ledger.totalTokens}` : `【Token 账本】累计调用: ${ledger.totalCalls} 次, 消耗: ${ledger.totalTokens} Tokens`)
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
        locale: { type: 'string', description: '输出语言：zh-CN 或 en-US（默认 zh-CN）' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
      },
      async execute(args: { roomId?: string; operatorRoleId?: string; scratchpad: string; locale?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const operator = args.operatorRoleId || 'commander'
        const result = roomManager.updateScratchpad(roomId, args.scratchpad, operator)
        const locale = normalizeToolLocale(args.locale)
        if (!result.success) return result.message
        return locale === 'en-US' ? `Shared scratchpad updated. Preview:\n${args.scratchpad.slice(0, 150)}...` : `共享黑板已更新！当前内容预览：\n${args.scratchpad.slice(0, 150)}...`
      },
    }),

    defineTool({
      name: 'group_chat_set_mode',
      description: '切换群聊发言调度模式（mention_only / moderator_led / workflow_driven / free_discussion）。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID' },
        mode: { type: 'string', required: true, description: '模式: mention_only | moderator_led | workflow_driven | free_discussion' },
        locale: { type: 'string', description: '输出语言：zh-CN 或 en-US（默认 zh-CN）' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
      },
      async execute(args: { roomId?: string; mode: string; locale?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const locale = normalizeToolLocale(args.locale)
        const mode = args.mode as DispatchMode
        if (!['mention_only', 'moderator_led', 'workflow_driven', 'free_discussion'].includes(mode)) {
          return locale === 'en-US' ? `Error: invalid dispatch mode ${args.mode}. Options: mention_only, moderator_led, workflow_driven, free_discussion` : `错误：无效的调度模式 ${args.mode}，可选：mention_only, moderator_led, workflow_driven, free_discussion`
        }
        const updated = roomManager.setDispatchMode(roomId, mode)
        if (!updated) return locale === 'en-US' ? `Error: group chat room ${roomId} does not exist.` : `错误：群聊房间 ${roomId} 不存在。`
        return locale === 'en-US' ? `Group chat [${updated.title}] dispatch mode switched to: ${mode}` : `群聊 [${updated.title}] 调度模式已切换为: ${mode}`
      },
    }),

    defineTool({
      name: 'group_chat_commander_digest',
      description: '汇总主 Agent 收件箱：按 SubAgent 回传、未读状态、证据引用生成可读摘要，供 commander 收口。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID' },
        masterRoleId: { type: 'string', description: '主 Agent 角色 ID（默认 commander）' },
        locale: { type: 'string', description: '输出语言：zh-CN 或 en-US（默认 zh-CN）' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
      },
      async execute(args: { roomId?: string; masterRoleId?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        return roomManager.formatCommanderMailboxDigest(roomId, args.masterRoleId || 'commander')
      },
    }),

    defineTool({
      name: 'group_chat_export_summary',
      description: '导出群聊协作讨论纪要、工作流流转过程与消耗账本（Markdown 格式）。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID' },
        locale: { type: 'string', description: '导出语言：zh-CN 或 en-US（默认 zh-CN）' },
      },
      output: {
        schema: { type: 'string' },
        render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }],
      },
      async execute(args: { roomId?: string; locale?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        return roomManager.exportMeetingSummary(roomId, args.locale === 'en-US' ? 'en-US' : 'zh-CN')
      },
    }),
  ]
}
