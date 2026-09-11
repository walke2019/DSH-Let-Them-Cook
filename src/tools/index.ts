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

        const list = room.members.map(m => {
          const name = locale === 'en-US' && m.nameEn ? m.nameEn : m.name
          const title = locale === 'en-US' && m.titleEn ? m.titleEn : (m.title || '')
          return `- ${m.avatar} **${name}** (\`@${m.id}\`${title ? `, ${title}` : ''})`
        })
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
        if (room.workflow) {
          const currentStage = room.workflow.stages[room.workflow.currentStageIndex]
          if (currentStage?.tasks?.length) {
            for (const t of currentStage.tasks) {
              if (t.status !== 'passed') {
                t.status = 'passed'
                t.updatedAt = Date.now()
              }
            }
          }
        }
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
      name: 'group_chat_task_claim',
      description: '团队协同工具：Agent 领取/恢复任务，写入 Captain Task Protocol 便于主 Agent 统筹。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID' },
        actorRoleId: { type: 'string', required: true, description: '领取任务的角色 ID' },
        assignmentId: { type: 'string', description: '关联 assignment ID' },
        taskId: { type: 'string', description: '关联路线图 task ID' },
        content: { type: 'string', description: '领取说明' },
        locale: { type: 'string', description: '输出语言：zh-CN 或 en-US（默认 zh-CN）' },
      },
      output: { schema: { type: 'string' }, render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }] },
      async execute(args: { roomId?: string; actorRoleId: string; assignmentId?: string; taskId?: string; content?: string; locale?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const locale = normalizeToolLocale(args.locale)
        const event = roomManager.recordCoordinationEvent(roomId, { type: 'claim', actorRoleId: args.actorRoleId, assignmentId: args.assignmentId, taskId: args.taskId, content: args.content || 'Task claimed.' })
        return event ? (locale === 'en-US' ? `Task claimed by @${args.actorRoleId}.` : `任务已由 @${args.actorRoleId} 领取。`) : (locale === 'en-US' ? 'Room not found.' : '未找到房间。')
      },
    }),

    defineTool({
      name: 'group_chat_task_block',
      description: '团队协同工具：Agent 标记任务阻塞，并把阻塞原因上报给主 Agent。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID' },
        actorRoleId: { type: 'string', required: true, description: '阻塞角色 ID' },
        assignmentId: { type: 'string', description: '关联 assignment ID' },
        taskId: { type: 'string', description: '关联路线图 task ID' },
        reason: { type: 'string', required: true, description: '阻塞原因与需要补充的信息' },
        locale: { type: 'string', description: '输出语言：zh-CN 或 en-US（默认 zh-CN）' },
      },
      output: { schema: { type: 'string' }, render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }] },
      async execute(args: { roomId?: string; actorRoleId: string; assignmentId?: string; taskId?: string; reason: string; locale?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const locale = normalizeToolLocale(args.locale)
        const event = roomManager.recordCoordinationEvent(roomId, { type: 'block', actorRoleId: args.actorRoleId, assignmentId: args.assignmentId, taskId: args.taskId, content: args.reason })
        return event ? (locale === 'en-US' ? `Task blocked by @${args.actorRoleId}: ${args.reason}` : `任务被 @${args.actorRoleId} 标记阻塞：${args.reason}`) : (locale === 'en-US' ? 'Room not found.' : '未找到房间。')
      },
    }),

    defineTool({
      name: 'group_chat_task_handoff',
      description: '团队协同工具：Agent 将任务移交给指定角色，避免多个 Agent 乱抢同一个工具任务。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID' },
        actorRoleId: { type: 'string', required: true, description: '发起移交角色 ID' },
        targetRoleId: { type: 'string', required: true, description: '接手角色 ID' },
        assignmentId: { type: 'string', description: '关联 assignment ID' },
        taskId: { type: 'string', description: '关联路线图 task ID' },
        content: { type: 'string', description: '移交原因/上下文' },
        locale: { type: 'string', description: '输出语言：zh-CN 或 en-US（默认 zh-CN）' },
      },
      output: { schema: { type: 'string' }, render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }] },
      async execute(args: { roomId?: string; actorRoleId: string; targetRoleId: string; assignmentId?: string; taskId?: string; content?: string; locale?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const locale = normalizeToolLocale(args.locale)
        const event = roomManager.recordCoordinationEvent(roomId, { type: 'handoff', actorRoleId: args.actorRoleId, targetRoleId: args.targetRoleId, assignmentId: args.assignmentId, taskId: args.taskId, content: args.content || '' })
        if (event && onTriggerAgentTurn) void onTriggerAgentTurn(roomId, args.targetRoleId).catch(console.error)
        return event ? (locale === 'en-US' ? `Task handed off from @${args.actorRoleId} to @${args.targetRoleId}.` : `任务已从 @${args.actorRoleId} 移交给 @${args.targetRoleId}。`) : (locale === 'en-US' ? 'Room not found.' : '未找到房间。')
      },
    }),

    defineTool({
      name: 'group_chat_task_report',
      description: '团队协同工具：SubAgent 向主 Agent 上报结果，写入 mailbox 和路线图。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID' },
        actorRoleId: { type: 'string', required: true, description: '上报角色 ID' },
        assignmentId: { type: 'string', description: '关联 assignment ID' },
        taskId: { type: 'string', description: '关联路线图 task ID' },
        content: { type: 'string', required: true, description: '结果摘要、证据、下一步建议' },
        locale: { type: 'string', description: '输出语言：zh-CN 或 en-US（默认 zh-CN）' },
      },
      output: { schema: { type: 'string' }, render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }] },
      async execute(args: { roomId?: string; actorRoleId: string; assignmentId?: string; taskId?: string; content: string; locale?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const locale = normalizeToolLocale(args.locale)
        const room = roomManager.getRoom(roomId)
        const masterRoleId = room?.orchestration?.masterAgentId || room?.moderatorAgentId || 'commander'
        const event = roomManager.recordCoordinationEvent(roomId, { type: 'report', actorRoleId: args.actorRoleId, assignmentId: args.assignmentId, taskId: args.taskId, content: args.content })
        if (event && args.actorRoleId !== masterRoleId) roomManager.addMailboxMessage(roomId, { fromRoleId: args.actorRoleId, toRoleId: masterRoleId, assignmentId: args.assignmentId, content: args.content })
        return event ? (locale === 'en-US' ? `Report sent to @${masterRoleId}.` : `结果已上报给 @${masterRoleId}。`) : (locale === 'en-US' ? 'Room not found.' : '未找到房间。')
      },
    }),

    defineTool({
      name: 'group_chat_task_close',
      description: '团队协同工具：主 Agent 收口一条任务路线图节点。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID' },
        actorRoleId: { type: 'string', description: '收口角色 ID，默认 commander' },
        taskId: { type: 'string', description: '路线图 task ID' },
        content: { type: 'string', description: '收口结论' },
        locale: { type: 'string', description: '输出语言：zh-CN 或 en-US（默认 zh-CN）' },
      },
      output: { schema: { type: 'string' }, render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }] },
      async execute(args: { roomId?: string; actorRoleId?: string; taskId?: string; content?: string; locale?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const locale = normalizeToolLocale(args.locale)
        const actorRoleId = args.actorRoleId || 'commander'
        const event = roomManager.recordCoordinationEvent(roomId, { type: 'close', actorRoleId, taskId: args.taskId, content: args.content || 'Closed by commander.' })
        return event ? (locale === 'en-US' ? `Task closed by @${actorRoleId}.` : `任务已由 @${actorRoleId} 收口。`) : (locale === 'en-US' ? 'Room not found.' : '未找到房间。')
      },
    }),

    defineTool({
      name: 'group_chat_transaction_create',
      description: '创建确认后执行卡片：列出将改动内容与回滚路径，等待用户/主 Agent 批准。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID' },
        title: { type: 'string', required: true, description: '事务标题' },
        summary: { type: 'string', required: true, description: '事务摘要' },
        willChange: { type: 'array', description: '将改动的事项列表' },
        rollbackPlan: { type: 'array', description: '回滚步骤列表' },
        createdByRoleId: { type: 'string', description: '创建角色 ID' },
        locale: { type: 'string', description: '输出语言：zh-CN 或 en-US（默认 zh-CN）' },
      },
      output: { schema: { type: 'string' }, render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }] },
      async execute(args: { roomId?: string; title: string; summary: string; willChange?: string[]; rollbackPlan?: string[]; createdByRoleId?: string; locale?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const locale = normalizeToolLocale(args.locale)
        const tx = roomManager.createApprovalTransaction(roomId, args.title, args.summary, Array.isArray(args.willChange) ? args.willChange : [], Array.isArray(args.rollbackPlan) ? args.rollbackPlan : [], args.createdByRoleId || 'commander')
        return tx ? (locale === 'en-US' ? `Approve & Run card created: ${tx.transactionId}` : `确认后执行卡片已创建：${tx.transactionId}`) : (locale === 'en-US' ? 'Room not found.' : '未找到房间。')
      },
    }),

    defineTool({
      name: 'group_chat_transaction_action',
      description: '处理确认后执行卡片：approve / reject / rollback。',
      parameters: {
        roomId: { type: 'string', description: '群聊房间 ID' },
        transactionId: { type: 'string', required: true, description: '事务 ID' },
        action: { type: 'string', required: true, description: 'approve | reject | rollback' },
        resolvedByRoleId: { type: 'string', description: '处理角色 ID' },
        locale: { type: 'string', description: '输出语言：zh-CN 或 en-US（默认 zh-CN）' },
      },
      output: { schema: { type: 'string' }, render: (_args: unknown, value: unknown) => [{ type: 'text', text: String(value) }] },
      async execute(args: { roomId?: string; transactionId: string; action: string; resolvedByRoleId?: string; locale?: string }) {
        const roomId = args.roomId || roomManager.getAllRooms()[0]?.roomId || 'dev-team-alpha'
        const locale = normalizeToolLocale(args.locale)
        const tx = roomManager.resolveApprovalTransaction(roomId, args.transactionId, args.action as any, args.resolvedByRoleId || 'commander')
        return tx ? (locale === 'en-US' ? `Transaction ${tx.transactionId} is now ${tx.status}.` : `事务 ${tx.transactionId} 已更新为 ${tx.status}。`) : (locale === 'en-US' ? 'Transaction not found.' : '未找到事务。')
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
