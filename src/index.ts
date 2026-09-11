import {join} from 'node:path'
import {ModelSettingsStore, validateModels} from './engine/model-settings.js'
import {WorkspaceRoomStateStore} from './engine/workspace-settings.js'
/**
 * Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { RoomManager } from './engine/room-manager.js'
import { SharedToolBus } from './engine/tool-bus.js'
import { ModelFallbackError, ModelResilienceManager } from './engine/resilience.js'
import { DispatchArbiter } from './engine/arbiter.js'
import { ContextProjection } from './engine/projection.js'
import { WorkflowOrchestrator } from './engine/workflow-orchestrator.js'
import { runMemberTurn, type RuntimeContext } from './engine/agent-runtime.js'
import { registerGroupChatTools } from './tools/index.js'
import { createThemeDraft, createWorkflowDraft } from './engine/theme-factory.js'
import { buildAutoSetupDraft, classifyAutoSetupIntent, formatAutoSetupApplied, formatAutoSetupCancelled, formatAutoSetupDraft } from './engine/auto-setup.js'
import { recommendModelsForRoles } from './engine/model-recommender.js'
import { detectDshCompat, getCurrentModel, safeListModelCatalog } from './compat/dsh.js'
import { inferAgentTaskStatus, parseStructuredAgentResult, stripStructuredAgentResult } from './engine/structured-result.js'
import type {GroupChatLocale} from './client/i18n.js'
import type { DispatchMode, GroupTaskTier, PersonaThemeKey } from './types.js'

export const name = '@dsh-external/dsh-group-chat'
export const inject = ['tools', 'webServer', 'agents', 'systemPrompt', 'agentDefaultModel', 'llm']

export interface Config {
  defaultMode: string
  maxTurnsPerPrompt: number
  silenceToken: string
}

export const Config = z.object({
  defaultMode: z.string().default('workflow_driven'),
  maxTurnsPerPrompt: z.number().default(6),
  silenceToken: z.string().default('NO_REPLY'),
})

export type AppContext = RuntimeContext & {
  llm: {listProviders(): {id:string;name:string}[]; listModels(provider:string): Promise<{id:string;name:string}[]>}
  webServer: any
  tools: any
  logger: any
}

export function apply(ctx: AppContext, config: Config): void {
  const logger = ctx.logger?.('@dsh-external/dsh-group-chat') || console
  const compatReport = detectDshCompat(ctx)
  for (const warning of compatReport.warnings) logger.warn?.(`[compat] ${warning}`)

  const workspaceStore = new WorkspaceRoomStateStore(join(process.cwd(), '.pm-workflow', 'dsh-group-chat', 'rooms.json'))
  const roomManager = new RoomManager()
  for (const savedRoom of workspaceStore.all()) {
    roomManager.saveRoom(savedRoom)
    roomManager.restoreRuntimeState(savedRoom.roomId, workspaceStore.messages(savedRoom.roomId), workspaceStore.ledger(savedRoom.roomId))
    const interrupted = roomManager.settleInterruptedAssignments(savedRoom.roomId)
    const current = roomManager.getRoom(savedRoom.roomId)
    if (interrupted && current) workspaceStore.saveSnapshot(current, roomManager.getMessages(savedRoom.roomId), roomManager.getLedger(savedRoom.roomId))
  }
  const modelSettings = new ModelSettingsStore(join(process.cwd(), '.pm-workflow', 'dsh-group-chat', 'model-settings.json'))
  for(const room of roomManager.getAllRooms())for(const member of room.members){
    const saved=modelSettings.get(room.roomId,member.id)
    if(saved)roomManager.updateAgentProfile(room.roomId,member.id,saved)
  }
  const toolBus = new SharedToolBus()
  const resilience = new ModelResilienceManager()

  const lifetime = new AbortController()
  const timers = new Set<ReturnType<typeof setTimeout>>()
  const streams = new Set<() => void>()
  ctx.effect(() => () => {
    lifetime.abort(new Error('Group-chat plugin unloaded'))
    for (const timer of timers) clearTimeout(timer)
    timers.clear()
    for (const close of streams) close()
    streams.clear()
  })
  const schedule = (task: () => void, delay: number) => {
    if (lifetime.signal.aborted) return
    const timer = setTimeout(() => { timers.delete(timer); if (!lifetime.signal.aborted) task() }, delay)
    timers.add(timer)
  }
  const normalizeApiLocale = (value: unknown): GroupChatLocale => value === 'en-US' ? 'en-US' : 'zh-CN'
  const autoSetupSender = (locale: GroupChatLocale) => ({kind:'system' as const,id:'auto-setup',name: locale === 'en-US' ? 'Setup Assistant' : '自动配置助手',avatar:'🧩'})
  const groupSystemSender = (locale: GroupChatLocale) => ({ kind: 'system' as const, id: 'group-chat', name: locale === 'en-US' ? 'Group Chat System' : '群聊系统', avatar: '⚠️' })
  const persistRoomState = (roomId: string) => {
    const current = roomManager.getRoom(roomId)
    if (current) workspaceStore.saveSnapshot(current, roomManager.getMessages(roomId), roomManager.getLedger(roomId))
  }
  const expectedMsForTier = (tier: GroupTaskTier | undefined, agentId: string, roomId?: string): number => {
    const member = roomId ? roomManager.getRoom(roomId)?.members.find(item => item.id === agentId) : undefined
    const policyTimeout = member?.resiliencePolicy?.timeoutMs || 0
    if (tier === 'quick') {
      if (agentId === 'researcher' || agentId === 'backend') return Math.max(180000, Math.min(300000, policyTimeout + 60000))
      return Math.max(120000, Math.min(240000, policyTimeout + 30000))
    }
    return Math.max(240000, Math.min(480000, policyTimeout + 120000))
  }
  const createTurnAssignment = (roomId: string, targetAgentId: string, brief: string, sourceMessageId?: string, createdByRoleId?: string, stageId?: string, taskTier?: GroupTaskTier) => {
    const current = roomManager.getRoom(roomId)
    const stage = stageId ? current?.workflow?.stages.find(item => item.id === stageId) : current?.workflow?.stages[current.workflow.currentStageIndex]
    const task = stage ? WorkflowOrchestrator.getReadyTasks(stage, targetAgentId)[0] : undefined
    const assignmentBrief = task ? `${brief}\n\n工作流阶段任务：${task.title}：${task.description}` : brief
    const effectiveTier: GroupTaskTier = (stage || current?.dispatchMode === 'workflow_driven' || taskTier === 'long') ? 'long' : (taskTier || 'quick')
    const expectedMs = expectedMsForTier(effectiveTier, targetAgentId, roomId)
    const assignment = roomManager.createAssignment(roomId, targetAgentId, assignmentBrief, { sourceMessageId, createdByRoleId, stageId: stage?.id || stageId, workflowTaskId: task?.taskId, taskTier: effectiveTier, expectedMs })
    if (current && stage && task && assignment) {
      WorkflowOrchestrator.updateTaskStatus(current, stage.id, task.taskId, 'running', { assignmentId: assignment.assignmentId })
      roomManager.saveRoom(current)
      roomManager.broadcast({ type: 'room:updated', roomId, payload: current, timestamp: Date.now() })
    }
    if (assignment) {
      schedule(() => {
        const latest = roomManager.getRoom(roomId)
        const live = latest?.assignments?.find(item => item.assignmentId === assignment.assignmentId)
        if (!latest || !live || (live.status !== 'queued' && live.status !== 'running')) return
        const locale = normalizeApiLocale(roomManager.getMessages(roomId).find(item => item.messageId === sourceMessageId)?.metadata?.locale)
        const message = taskTier === 'quick'
          ? (locale === 'en-US' ? 'Quick task exceeded its expected runtime and was stopped by the assignment watchdog.' : '快速任务超过预期执行时间，已由任务看门狗停止。')
          : (locale === 'en-US' ? 'Long task exceeded its expected runtime and needs retry or user review.' : '长任务超过预期执行时间，需要重试或用户复核。')
        const timeoutMessage = roomManager.addMessage(roomId, {
          roomId,
          sender: groupSystemSender(locale),
          content: message,
          mentions: [],
          metadata: { systemNotice: 'assignment-watchdog-timeout', assignmentId: assignment.assignmentId, taskTier },
        })
        const failed = roomManager.completeAssignment(roomId, assignment.assignmentId, timeoutMessage.messageId, message)
        if (failed?.stageId && failed.workflowTaskId) {
          WorkflowOrchestrator.updateTaskStatus(latest, failed.stageId, failed.workflowTaskId, 'failed', { assignmentId: failed.assignmentId, verificationOutput: message, verificationExitCode: 124 })
          roomManager.saveRoom(latest)
        }
        roomManager.broadcast({ type: 'agent:status', roomId, payload: { agentId: targetAgentId, name: targetAgentId, avatar: '⚠️', status: 'error', assignmentId: assignment.assignmentId, message }, timestamp: Date.now() })
        persistRoomState(roomId)

        const masterId = latest.orchestration?.masterAgentId || latest.moderatorAgentId || 'commander'
        if (targetAgentId !== masterId) {
          roomManager.addMailboxMessage(roomId, {
            fromRoleId: targetAgentId,
            toRoleId: masterId,
            assignmentId: assignment.assignmentId,
            content: locale === 'en-US' ? `[Task Interrupted] Watchdog stopped task after exceeding runtime limit.` : `[任务中断] 任务执行耗时超出限额，已由看门狗停止，请指挥官介入统筹。`,
          })
          schedule(() => {
            void triggerAgentTurn(roomId, masterId).catch(console.error)
          }, 1500)
        }
      }, expectedMs + (taskTier === 'quick' ? 30000 : 60000))
    }
    persistRoomState(roomId)
    return assignment
  }

  // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
  const readJsonBody = async (req: any): Promise<any> => {
    return new Promise((resolve) => {
      let body = ''
      req.on('data', (chunk: Buffer | string) => {
        body += chunk
      })
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {})
        } catch {
          resolve({})
        }
      })
    })
  }

  /**
 * Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
 */
  const triggerAgentTurn = async (roomId: string, targetAgentId: string, assignmentId?: string): Promise<void> => {
    if (lifetime.signal.aborted) return
    const room = roomManager.getRoom(roomId)
    if (!room) return

    const member = room.members.find(m => m.id === targetAgentId)
    if (!member) return

    const messages = roomManager.getMessages(roomId)
    const activeAssignment = assignmentId ? room.assignments?.find(a => a.assignmentId === assignmentId) : undefined
    const sourceMessage = activeAssignment?.sourceMessageId ? messages.find(m => m.messageId === activeAssignment.sourceMessageId) : messages.slice(-1)[0]
    const locale = normalizeApiLocale(sourceMessage?.metadata?.locale)

    roomManager.markAssignmentRunning(roomId, assignmentId)
    persistRoomState(roomId)
    roomManager.broadcast({type:'agent:status',roomId,payload:{agentId:member.id,name:member.name,avatar:member.avatar,title:member.title,status:'running',assignmentId,taskTier:room.assignments?.find(a=>a.assignmentId===assignmentId)?.taskTier,expectedMs:room.assignments?.find(a=>a.assignmentId===assignmentId)?.expectedMs,startedAt:Date.now()},timestamp:Date.now()})

    // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
    const effectiveMaxTurns = (room.dispatchMode === 'workflow_driven' || room.assignments?.some(a => a.taskTier === 'long'))
      ? Math.max(room.safetyPolicy.maxTurnsPerPrompt || 6, 24)
      : (room.safetyPolicy.maxTurnsPerPrompt || 6)
    const currentRound = roomManager.incrementInteractionRound(roomId)
    if (currentRound > effectiveMaxTurns) {
      logger.info?.(`[GroupChat] Room ${roomId} reached max turns (${effectiveMaxTurns}), circuit tripped.`)
      roomManager.broadcast({
        type: 'circuit_breaker:tripped',
        roomId,
        payload: {
          round: currentRound,
          max: effectiveMaxTurns,
          reason: locale === 'en-US' ? 'Reached the maximum autonomous collaboration turns for this instruction; circuit breaker tripped.' : '已达到单次指令最大自主协作轮次限制，触发硬性熔断。',
        },
        timestamp: Date.now(),
      })
      return
    }

    const systemPrompt = ContextProjection.assembleSystemPrompt(member, room, messages, locale)

    let replyContent = ''
    let reasoningContent = ''
    let modelUsed = member.llmConfig.model
    let providerUsed = member.llmConfig.provider
    let isFallback = false
    let fallbackChain: string[] = []
    let runtimeMetrics: import('./types.js').AgentRuntimeMetrics | undefined
    let toolCalls: import('./types.js').ToolCallRecord[] = []

    try {
      const profile = member.llmConfig.provider && member.llmConfig.model ? member : {
        ...member, llmConfig: { ...getCurrentModel(ctx), temperature: member.llmConfig.temperature },
      }
      const execution = await resilience.executeWithFallback(profile, (modelRef, signal) =>
        runMemberTurn(ctx, modelRef, systemPrompt, signal, { roleId: member.id, allowedTools: member.permissions.allowedTools, locale }), lifetime.signal)
      replyContent = execution.result.content
      modelUsed = execution.result.modelUsed
      providerUsed = execution.result.providerUsed
      isFallback = execution.isFallback
      fallbackChain = execution.fallbackChain
      runtimeMetrics = execution.result.metrics
      toolCalls = execution.result.toolCalls || []
      logger.info?.(`[GroupChat] ${member.name} completed with ${providerUsed}/${modelUsed}; elapsed=${execution.totalElapsedMs}ms; attempts=${execution.attempts.length}`)
      try{
        for(const attempt of execution.attempts) modelSettings.markResult({provider:attempt.provider,model:attempt.model}, !attempt.error, attempt.error)
        modelSettings.remember({provider:providerUsed,model:modelUsed})
      }catch(error){logger.warn?.('最近模型/可用性记录保存失败',error)}
    } catch (err) {
      if (lifetime.signal.aborted) return
      const message = err instanceof Error ? err.message : String(err)
      if(err instanceof ModelFallbackError){
        try{for(const attempt of err.attempts) modelSettings.markResult({provider:attempt.provider,model:attempt.model}, false, attempt.error)}catch(error){logger.warn?.('模型可用性失败记录保存失败',error)}
      }
      logger.warn?.(`[GroupChat] ${member.name}: ${message}`)
      roomManager.broadcast({ type: 'error:notice', roomId,
        payload: { agentId: member.id, message }, timestamp: Date.now() })
      roomManager.broadcast({type:'agent:status',roomId,payload:{agentId:member.id,name:member.name,avatar:member.avatar,title:member.title,status:'error',message},timestamp:Date.now()})
      const locale = normalizeApiLocale(roomManager.getMessages(roomId).slice(-1)[0]?.metadata?.locale)
      roomManager.addMessage(roomId, {
        roomId, sender: groupSystemSender(locale),
        content: locale === 'en-US' ? `${member.name} model call failed: ${message}` : `${member.name} 模型调用失败：${message}`, mentions: [], metadata: { systemNotice: 'model-error', assignmentId, taskTier: room.assignments?.find(a=>a.assignmentId===assignmentId)?.taskTier },
      })
      const failedAssignment = roomManager.completeAssignment(roomId, assignmentId, 'model-error', message)
      if (failedAssignment?.stageId && failedAssignment.workflowTaskId) {
        const current = roomManager.getRoom(roomId)
        if (current) {
          WorkflowOrchestrator.updateTaskStatus(current, failedAssignment.stageId, failedAssignment.workflowTaskId, 'failed', { assignmentId: failedAssignment.assignmentId, verificationOutput: message, verificationExitCode: 1 })
          roomManager.saveRoom(current)
        }
      }
      persistRoomState(roomId)

      const masterId = room.orchestration?.masterAgentId || room.moderatorAgentId || 'commander'
      if (member.id !== masterId) {
        roomManager.addMailboxMessage(roomId, {
          fromRoleId: member.id,
          toRoleId: masterId,
          assignmentId,
          content: locale === 'en-US' ? `[Task Error] ${member.name} encountered error: ${message}` : `[任务执行受阻] ${member.name} 执行出错：${message}`,
        })
        schedule(() => {
          void triggerAgentTurn(roomId, masterId).catch(console.error)
        }, 1500)
      }
      return
    }
    if (lifetime.signal.aborted) return
    roomManager.broadcast({type:'agent:status',roomId,payload:{agentId:member.id,name:member.name,avatar:member.avatar,title:member.title,status:'complete',assignmentId,modelUsed,providerUsed,finishedAt:Date.now()},timestamp:Date.now()})

    // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
    if (DispatchArbiter.isSilenceToken(replyContent, room.safetyPolicy.silenceToken)) {
      logger.info?.(`[GroupChat] Agent ${member.name} (${member.id}) emitted NO_REPLY, silenced.`)
      return
    }

    const structuredResult = parseStructuredAgentResult(replyContent)
    const visibleReplyContent = stripStructuredAgentResult(replyContent)

    // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
    const { targetAgentIds } = DispatchArbiter.extractMentions(visibleReplyContent, room.members)

    // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
    const envelope = roomManager.addMessage(roomId, {
      roomId,
      sender: {
        kind: 'agent',
        id: member.id,
        name: member.name,
        avatar: member.avatar,
        color: member.color,
      },
      content: visibleReplyContent,
      reasoningContent,
      mentions: targetAgentIds,
      metadata: {
        modelUsed,
        providerUsed,
        isFallback,
        fallbackChain,
        runtimeMetrics,
        assignmentId,
        taskTier: room.assignments?.find(a=>a.assignmentId===assignmentId)?.taskTier,
        structuredResult: structuredResult ? {status: structuredResult.status, summary: structuredResult.summary, next: structuredResult.next, evidence: structuredResult.evidence} : undefined,
        toolCalls,
        tokensConsumed: runtimeMetrics ? { promptTokens: runtimeMetrics.inputTokens + runtimeMetrics.cacheReadTokens + runtimeMetrics.cacheWriteTokens, completionTokens: runtimeMetrics.outputTokens, totalTokens: runtimeMetrics.inputTokens + runtimeMetrics.cacheReadTokens + runtimeMetrics.cacheWriteTokens + runtimeMetrics.outputTokens } : undefined,

      },
    })

    const completedAssignment = roomManager.completeAssignment(roomId, assignmentId, envelope.messageId)
    if (completedAssignment?.stageId && completedAssignment.workflowTaskId) {
      const current = roomManager.getRoom(roomId)
      if (current) {
        const taskStatus = inferAgentTaskStatus(replyContent)
        WorkflowOrchestrator.updateTaskStatus(current, completedAssignment.stageId, completedAssignment.workflowTaskId, taskStatus, { assignmentId: completedAssignment.assignmentId, verificationOutput: structuredResult?.summary, verifiedByRoleId: member.id })
        roomManager.saveRoom(current)
        persistRoomState(roomId)
        roomManager.broadcast({ type: 'room:updated', roomId, payload: current, timestamp: Date.now() })
      }
    }

    // Auto-sync milestone conclusion & technical decisions to shared scratchpad
    const summaryText = structuredResult?.summary || (() => {
      const lines = visibleReplyContent.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('---') && l.length > 8)
      return (lines[0] || visibleReplyContent.slice(0, 140)).replace(/\*\*/g, '').slice(0, 160)
    })()

    if (summaryText && member.id !== 'group-chat') {
      const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const currentRoom = roomManager.getRoom(roomId)
      const stageName = currentRoom?.workflow?.stages[currentRoom.workflow.currentStageIndex]?.name || '任务协作'
      const note = `\n- [${dateStr}] [${stageName}] **${member.name}**：${summaryText}`
      if (currentRoom) {
        currentRoom.scratchpad = `${currentRoom.scratchpad || ''}${note}`
        roomManager.saveRoom(currentRoom)
        persistRoomState(roomId)
        roomManager.broadcast({ type: 'scratchpad:updated', roomId, payload: { scratchpad: currentRoom.scratchpad }, timestamp: Date.now() })
      }
    }

    const masterId = room.orchestration?.masterAgentId || room.moderatorAgentId || 'commander'
    if (member.id !== masterId) {
      roomManager.addMailboxMessage(roomId, {
        fromRoleId: member.id,
        toRoleId: masterId,
        assignmentId,
        content: visibleReplyContent,
      })
    }
    persistRoomState(roomId)

    // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
    const decision = DispatchArbiter.decideNextSpeakers(room, envelope)
    if (!decision.isTerminal && decision.nextSpeakerIds.length > 0) {
      for (const nextId of decision.nextSpeakerIds) {
        const nextAssignment = createTurnAssignment(roomId, nextId, `接续 ${member.name} 的阶段汇报：${visibleReplyContent.slice(0, 180)}`, envelope.messageId, member.id, envelope.metadata.stageId, envelope.metadata.taskTier)
        schedule(() => {
          void triggerAgentTurn(roomId, nextId, nextAssignment?.assignmentId).catch(err => {
            logger.warn?.(`[GroupChat] Turn error for ${nextId}:`, err)
          })
        }, 1200)
      }
    }
  }

  // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
  ctx.effect(() => {
    return ctx.webServer.register({
      kind: 'prefix',
      path: '/dsh-group-chat/api',
      handler: async (req: any, res: any) => {
        const url = new URL(req.url, 'http://localhost')
        const pathname = url.pathname.replace('/dsh-group-chat/api', '')
        const method = req.method?.toUpperCase()

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (method === 'OPTIONS') {
          res.writeHead(204)
          res.end()
          return
        }

        if(method==='GET' && pathname==='/compat'){
          res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'})
          res.end(JSON.stringify(compatReport));return
        }

        if(method==='GET' && pathname==='/models'){
          const roomId = url.searchParams.get('roomId') || 'dev-team-alpha'
          const room = roomManager.getRoom(roomId)
          const catalog = await safeListModelCatalog(ctx)
          const groups = catalog.groups
          const current = getCurrentModel(ctx)
          const manualByRole = Object.fromEntries((room?.members || []).map(member => [member.id, member.llmConfig]))
          const recommendations = room?.orchestration?.modelHints ? recommendModelsForRoles(room.orchestration.modelHints, groups, {recent:modelSettings.recent(), current, manualByRole, limit:6}) : {}
          res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'})
          res.end(JSON.stringify({groups,recent:modelSettings.recent(),health:modelSettings.health(),current,recommendations,compat:compatReport,catalogWarnings:catalog.warnings,scope:{type:'workspace',path:process.cwd(),settings:modelSettings.location(),rooms:workspaceStore.location()}}));return
        }

        if(method==='POST' && pathname==='/models/recent/delete'){
          const body=await readJsonBody(req)
          const provider=String(body.provider||'').trim()
          const model=String(body.model||'').trim()
          if(!provider||!model){res.writeHead(400,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({success:false,error:'provider and model are required'}));return}
          modelSettings.forget({provider,model})
          res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'})
          res.end(JSON.stringify({success:true,recent:modelSettings.recent()}));return
        }

        // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
        if (method === 'GET' && (pathname === '/rooms' || pathname === '')) {
          const rooms = roomManager.getAllRooms()
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ rooms }))
          return
        }

        // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
        if (method === 'GET' && pathname === '/room') {
          const roomId = url.searchParams.get('id') || 'dev-team-alpha'
          const shouldEnsure = url.searchParams.get('ensure') === '1'
          const room = shouldEnsure ? roomManager.ensureRoomForSession(roomId, roomId.replace(/^dsh-/, '')) : roomManager.getRoom(roomId)
          if (!room) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Room not found' }))
            return
          }
          for (const member of room.members) {
            const saved = modelSettings.get(room.roomId, member.id)
            if (saved && (!member.llmConfig.provider || !member.llmConfig.model)) {
              roomManager.updateAgentProfile(room.roomId, member.id, saved)
            }
          }
          const messages = roomManager.getMessages(roomId)
          const ledger = roomManager.getLedger(roomId)
          if (ledger && ledger.totalTokens === 0 && messages.length > 0) {
            for (const m of messages) {
              if (m.sender.kind === 'agent') {
                const consumed = m.metadata?.tokensConsumed || {
                  promptTokens: Math.max(150, Math.ceil(m.content.length * 2.5)),
                  completionTokens: Math.max(40, Math.ceil(m.content.length * 0.7)),
                  totalTokens: Math.max(190, Math.ceil(m.content.length * 3.2)),
                }
                ledger.totalTokens += consumed.totalTokens
                const stat = ledger.agentStats[m.sender.id]
                if (stat) {
                  stat.promptTokens += consumed.promptTokens
                  stat.completionTokens += consumed.completionTokens
                  stat.totalTokens += consumed.totalTokens
                  ledger.metrics.inputTokens += consumed.promptTokens
                  ledger.metrics.outputTokens += consumed.completionTokens
                }
              }
            }
          }
          if ((!room.scratchpad || room.scratchpad.includes('等待本会话的新任务')) && messages.length > 0) {
            const notes: string[] = []
            for (const m of messages) {
              if (m.sender.kind === 'agent' && m.sender.id !== 'group-chat') {
                const lines = m.content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('---') && l.length > 8)
                const headline = (lines[0] || m.content.slice(0, 140)).replace(/\*\*/g, '').slice(0, 140)
                const timeStr = m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00'
                notes.push(`- [${timeStr}] **${m.sender.name}**：${headline}`)
              }
            }
            if (notes.length > 0) {
              room.scratchpad = `## 阶段共识与项目全局黑板\n- 机制：总指挥审核把关 + 调研先行 + 权限隔离 + 工作流流水线\n${notes.slice(-10).join('\n')}`
              roomManager.saveRoom(room)
              persistRoomState(roomId)
            }
          }
          if (shouldEnsure) persistRoomState(roomId)
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ room, messages, ledger }))
          return
        }

        // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
        if (method === 'POST' && pathname === '/auto-plan') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const locale = normalizeApiLocale(body.locale)
          const room = roomManager.getRoom(roomId)
          if (!room) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: false, error: 'Room not found' }))
            return
          }
          const brief = String(body.brief || '').trim()
          const intent = classifyAutoSetupIntent(brief, Boolean(room.pendingAutoSetup), locale)
          if (intent.kind === 'clarify' || intent.kind === 'none') {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ success: true, status: 'clarify', question: intent.kind === 'clarify' ? intent.question : (locale === 'en-US' ? 'Please add what this workspace mainly needs to deliver, then I will draft roles and workflow.' : '请补充这个工作区主要要完成什么任务，我再生成角色和工作流草案。') }))
            return
          }
          const priorBrief = room.pendingAutoSetup?.brief
          const draftBrief = priorBrief && intent.kind === 'draft' ? `${priorBrief}
补充：${intent.brief}` : brief
          const draft = buildAutoSetupDraft(draftBrief, room.members, locale)
          const updated = roomManager.setPendingAutoSetup(roomId, draft)
          if (updated) persistRoomState(roomId)
          const preview = formatAutoSetupDraft(draft, room.activeTheme, locale)
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: true, status: 'draft', draft, preview }))
          return
        }

        // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
        if (method === 'POST' && pathname === '/message') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const content = String(body.content || '').trim()
          const taskTier = (body.taskTier === 'long' ? 'long' : 'quick') as GroupTaskTier
          const locale = normalizeApiLocale(body.locale)

          if (!content) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'content is required' }))
            return
          }

          const room = roomManager.getRoom(roomId)
          if (!room) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Room not found' }))
            return
          }

          const { targetAgentIds } = DispatchArbiter.extractMentions(content, room.members)
          const leadingMention = room.members.find(member => member.groupChatRules.mentionKeywords.some(keyword => content.trim().startsWith(keyword)))

          // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
          const envelope = roomManager.addMessage(roomId, {
            roomId,
            sender: {
              kind: 'user',
              id: 'user',
              name: locale === 'en-US' ? 'Human lead' : '人类负责人',
              avatar: '👤',
            },
            content,
            mentions: targetAgentIds,
            metadata: { taskTier, locale, dispatchHint: taskTier === 'quick' ? (locale === 'en-US' ? 'Quick task: prefer fewer Agents, shorter path, less context.' : '快速任务：优先少 Agent、短链路、少上下文。') : (locale === 'en-US' ? 'Long task: keep workflow and multi-Agent collaboration.' : '长任务：保留工作流和多 Agent 协作。') },
          })

          roomManager.resetInteractionRound(roomId)
          roomManager.createCaptainTaskProtocol(roomId, envelope.messageId, content, taskTier)
          persistRoomState(roomId)

          // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
          const autoIntent = classifyAutoSetupIntent(content, Boolean(room.pendingAutoSetup), locale)
          if (autoIntent.kind === 'confirm') {
            const updated = roomManager.applyPendingAutoSetup(roomId)
            if (updated) persistRoomState(roomId)
            const orchestration = updated?.orchestration
            const workflow = updated?.workflow
            const systemMessage = roomManager.addMessage(roomId, {
              roomId,
              sender: autoSetupSender(locale),
              content: workflow && orchestration ? formatAutoSetupApplied(workflow, orchestration, updated.activeTheme, locale) : (locale === 'en-US' ? 'No pending draft found. Describe the roles and workflow you want to create first.' : '没有找到待确认草案，请先描述你要创建的角色和工作流。'),
              mentions: [],
              metadata: {systemNotice:'auto-setup-applied', autoSetup: updated ? 'applied' : 'clarify'},
            })
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ success: true, message: envelope, systemMessage, decision: {nextSpeakerIds: [], reason: locale === 'en-US' ? 'Auto setup draft confirmed.' : '自动配置草案确认处理完成。', mode: room.dispatchMode, isTerminal: true}, room: updated }))
            return
          }
          if (autoIntent.kind === 'cancel') {
            const updated = roomManager.setPendingAutoSetup(roomId, undefined)
            if (updated) persistRoomState(roomId)
            const systemMessage = roomManager.addMessage(roomId, {
              roomId,
              sender: autoSetupSender(locale),
              content: formatAutoSetupCancelled(room.activeTheme, locale),
              mentions: [],
              metadata: {systemNotice:'auto-setup-cancelled', autoSetup:'cancelled'},
            })
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ success: true, message: envelope, systemMessage, decision: {nextSpeakerIds: [], reason: locale === 'en-US' ? 'Auto setup draft cancelled.' : '自动配置草案已取消。', mode: room.dispatchMode, isTerminal: true} }))
            return
          }
          if (autoIntent.kind === 'clarify') {
            const systemMessage = roomManager.addMessage(roomId, {
              roomId,
              sender: autoSetupSender(locale),
              content: autoIntent.question,
              mentions: [],
              metadata: {systemNotice:'auto-setup-clarify', autoSetup:'clarify'},
            })
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ success: true, message: envelope, systemMessage, decision: {nextSpeakerIds: [], reason: locale === 'en-US' ? 'Auto setup intent is unclear; ask the user first.' : '自动配置意图不够明确，先追问用户。', mode: room.dispatchMode, isTerminal: true} }))
            return
          }
          if (autoIntent.kind === 'draft') {
            const priorBrief = room.pendingAutoSetup?.brief
            const brief = priorBrief ? `${priorBrief}
补充：${autoIntent.brief}` : autoIntent.brief
            const draft = buildAutoSetupDraft(brief, room.members, locale)
            const updated = roomManager.setPendingAutoSetup(roomId, draft)
            if (updated) persistRoomState(roomId)
            const systemMessage = roomManager.addMessage(roomId, {
              roomId,
              sender: autoSetupSender(locale),
              content: formatAutoSetupDraft(draft, room.activeTheme, locale),
              mentions: [],
              metadata: {systemNotice:'auto-setup-draft', autoSetup:'draft'},
            })
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ success: true, message: envelope, systemMessage, decision: {nextSpeakerIds: [], reason: autoIntent.reason, mode: room.dispatchMode, isTerminal: true}, draft }))
            return
          }

          const decision = DispatchArbiter.decideNextSpeakers(room, envelope)
          if (taskTier === 'quick') {
            const masterId = room.orchestration?.masterAgentId || room.moderatorAgentId || 'commander'
            const quickTargets = targetAgentIds.length ? targetAgentIds.slice(0, 2) : [masterId]
            decision.nextSpeakerIds = quickTargets
            decision.reason = locale === 'en-US' ? `${decision.reason}; quick task: limited to ${quickTargets.join(', ')} to avoid long workflow fan-out.` : `${decision.reason}；快速任务：限制为 ${quickTargets.join(', ')}，避免长工作流 fan-out。`
            decision.isTerminal = quickTargets.length === 0
          } else if (leadingMention) {
            decision.nextSpeakerIds = [leadingMention.id]
            decision.reason = locale === 'en-US' ? `${decision.reason}; long task with leading @${leadingMention.id}: hand off to the mentioned role first, then let it delegate SubAgents.` : `${decision.reason}；长任务首个 @${leadingMention.id}：先交给被点名角色承接，再由其分派 SubAgent。`
            decision.isTerminal = false
          } else if (targetAgentIds.length > 0) {
            decision.nextSpeakerIds = targetAgentIds
            decision.reason = locale === 'en-US' ? `${decision.reason}; long task with @${targetAgentIds.join(', ')}: hand off to mentioned role(s).` : `${decision.reason}；长任务点名：交给 [${targetAgentIds.join(', ')}] 承接执行。`
            decision.isTerminal = false
          }

          if (!decision.isTerminal && decision.nextSpeakerIds.length > 0) {
            for (const targetId of decision.nextSpeakerIds) {
              const currentStage = taskTier === 'long' ? room.workflow?.stages[room.workflow.currentStageIndex] : undefined
              const assignment = createTurnAssignment(roomId, targetId, content.slice(0, 240), envelope.messageId, room.orchestration?.masterAgentId || room.moderatorAgentId || 'commander', currentStage?.id, taskTier)
              schedule(() => {
                void triggerAgentTurn(roomId, targetId, assignment?.assignmentId).catch(console.error)
              }, taskTier === 'quick' ? 250 : 600)
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: true, message: envelope, decision }))
          return
        }


        // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
        if (method === 'POST' && pathname === '/scratchpad') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const scratchpad = String(body.scratchpad || '')
          const operator = body.operatorRoleId || 'commander'

          const result = roomManager.updateScratchpad(roomId, scratchpad, operator)
          if (result.room) persistRoomState(roomId)
          res.writeHead(result.success ? 200 : 403, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify(result))
          return
        }


        if (method === 'POST' && pathname === '/theme/draft') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const locale = normalizeApiLocale(body.locale)
          const room = roomManager.getRoom(roomId)
          if (!room) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Room not found' })); return }
          const brief = String(body.brief || '').trim()
          const members = createThemeDraft(brief, room.members, locale)
          const workflow = createWorkflowDraft(brief, locale)
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: true, brief, members, workflow }))
          return
        }

        if (method === 'POST' && pathname === '/theme/apply-draft') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const locale = normalizeApiLocale(body.locale)
          const room = roomManager.getRoom(roomId)
          if (!room) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Room not found' })); return }
          const members = Array.isArray(body.members) ? body.members : createThemeDraft(String(body.brief || ''), room.members, locale)
          const workflow = body.workflow || createWorkflowDraft(String(body.brief || ''), locale)
          const updated = roomManager.applyGeneratedTheme(roomId, members, `custom_${Date.now()}` as PersonaThemeKey, workflow)
          if (updated) persistRoomState(roomId)
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: !!updated, room: updated }))
          return
        }

        // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
        if (method === 'POST' && pathname === '/theme') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const rawTheme = String(body.theme || 'default')
          const theme = (rawTheme === 'default' ? 'meme_comedy' : rawTheme) as PersonaThemeKey

          const updated = roomManager.switchTheme(roomId, theme)
          if (updated) persistRoomState(roomId)
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: !!updated, room: updated }))
          return
        }

        if (method === 'POST' && pathname === '/coordination/event') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const locale = normalizeApiLocale(body.locale)
          const type = String(body.type || '') as any
          if (!['claim','block','handoff','report','close','resume'].includes(type)) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ success: false, error: 'valid coordination event type is required' }))
            return
          }
          const event = roomManager.recordCoordinationEvent(roomId, {
            type,
            actorRoleId: String(body.actorRoleId || 'commander'),
            targetRoleId: body.targetRoleId ? String(body.targetRoleId) : undefined,
            assignmentId: body.assignmentId ? String(body.assignmentId) : undefined,
            taskId: body.taskId ? String(body.taskId) : undefined,
            content: String(body.content || ''),
          })
          if (event) persistRoomState(roomId)
          res.writeHead(event ? 200 : 404, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: !!event, message: event ? (locale === 'en-US' ? 'Coordination event recorded.' : '协同事件已记录。') : 'Room not found', event }))
          return
        }

        if (method === 'POST' && pathname === '/transaction/create') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const locale = normalizeApiLocale(body.locale)
          const tx = roomManager.createApprovalTransaction(
            roomId,
            String(body.title || (locale === 'en-US' ? 'Approve & Run' : '确认后执行')),
            String(body.summary || ''),
            Array.isArray(body.willChange) ? body.willChange.map(String) : [],
            Array.isArray(body.rollbackPlan) ? body.rollbackPlan.map(String) : [],
            String(body.createdByRoleId || 'commander'),
          )
          if (tx) persistRoomState(roomId)
          res.writeHead(tx ? 200 : 404, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: !!tx, transaction: tx }))
          return
        }

        if (method === 'POST' && pathname === '/transaction/action') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const action = String(body.action || '') as any
          if (!['approve','reject','rollback'].includes(action)) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ success: false, error: 'valid transaction action is required' }))
            return
          }
          const tx = roomManager.resolveApprovalTransaction(roomId, String(body.transactionId || ''), action, String(body.resolvedByRoleId || 'commander'))
          if (tx) persistRoomState(roomId)
          res.writeHead(tx ? 200 : 404, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: !!tx, transaction: tx }))
          return
        }

        // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.

        if (method === 'POST' && pathname === '/mailbox/read') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const mailboxMessageId = String(body.mailboxMessageId || '')
          if (!mailboxMessageId) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ success: false, error: 'mailboxMessageId is required' }))
            return
          }
          const message = roomManager.markMailboxRead(roomId, mailboxMessageId, body.readerRoleId || 'commander')
          const room = roomManager.getRoom(roomId)
          if (message && room) persistRoomState(roomId)
          res.writeHead(message ? 200 : 404, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: !!message, message }))
          return
        }

        if (method === 'POST' && pathname === '/workflow/task') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const locale = normalizeApiLocale(body.locale)
          const room = roomManager.getRoom(roomId)
          if (!room) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Room not found' })); return }
          const stageId = String(body.stageId || room.workflow?.stages[room.workflow.currentStageIndex]?.id || '')
          const taskId = String(body.taskId || '')
          const status = String(body.status || '') as any
          if (!stageId || !taskId || !['pending','ready','running','passed','failed','rejected','request_human'].includes(status)) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ success: false, error: 'stageId, taskId and valid status are required' }))
            return
          }
          const result = WorkflowOrchestrator.updateTaskStatus(room, stageId, taskId, status, {
            assignmentId: body.assignmentId,
            verifyCommand: body.verifyCommand,
            verificationOutput: body.verificationOutput,
            verificationExitCode: typeof body.verificationExitCode === 'number' ? body.verificationExitCode : undefined,
            verifiedByRoleId: body.verifiedByRoleId || 'qa',
            locale,
          })
          roomManager.saveRoom(room)
          persistRoomState(roomId)
          res.writeHead(result.success ? 200 : 404, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify(result))
          return
        }

        if (method === 'POST' && pathname === '/workflow/task-action') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const locale = normalizeApiLocale(body.locale)
          const room = roomManager.getRoom(roomId)
          if (!room) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Room not found' })); return }
          const stageId = String(body.stageId || room.workflow?.stages[room.workflow.currentStageIndex]?.id || '')
          const taskId = String(body.taskId || '')
          const action = String(body.action || '') as 'retry' | 'request_human' | 'skip'
          if (!stageId || !taskId || !['retry','request_human','skip'].includes(action)) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ success: false, error: 'stageId, taskId and valid action are required' }))
            return
          }
          const result = WorkflowOrchestrator.applyTaskAction(room, stageId, taskId, action, body.actorRoleId || 'commander', String(body.reason || ''), locale)
          roomManager.saveRoom(room)
          persistRoomState(roomId)
          res.writeHead(result.success ? 200 : 404, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify(result))
          return
        }

        if (method === 'POST' && pathname === '/workflow/action') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const locale = normalizeApiLocale(body.locale)
          const action = body.action as 'advance' | 'reject'
          const room = roomManager.getRoom(roomId)

          if (!room) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Room not found' }))
            return
          }

          if (action === 'advance') {
            const result = WorkflowOrchestrator.advanceStage(room, body.approverRoleId || 'commander', body.summary, locale)
            roomManager.saveRoom(room)
            persistRoomState(roomId)
            roomManager.broadcast({ type: 'room:updated', roomId, payload: room, timestamp: Date.now() })
            if (result.stage) {
              const readyTasks = WorkflowOrchestrator.getReadyTasks(result.stage)
              const readyRoles = readyTasks.length > 0
                ? [...new Set(readyTasks.map(t => t.ownerRoleId))]
                : (result.stage.assignedRoleIds.filter(id => id !== 'commander').length ? result.stage.assignedRoleIds.filter(id => id !== 'commander') : result.stage.assignedRoleIds)
              for (const nextRole of readyRoles) {
                const assignment = createTurnAssignment(roomId, nextRole, locale === 'en-US' ? `Workflow advanced: ${result.message}` : `工作流推进：${result.message}`, undefined, body.approverRoleId || 'commander', result.stage?.id, 'long')
                schedule(() => {
                  void triggerAgentTurn(roomId, nextRole, assignment?.assignmentId).catch(console.error)
                }, 600)
              }
            }
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify(result))
            return
          } else if (action === 'reject') {
            const result = WorkflowOrchestrator.rejectStage(room, 'commander', body.reason || (locale === 'en-US' ? 'Acceptance not met; revise and retry.' : '未达标要求重新修改'), locale)
            roomManager.saveRoom(room)
            persistRoomState(roomId)
            roomManager.broadcast({ type: 'room:updated', roomId, payload: room, timestamp: Date.now() })
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify(result))
            return
          }
        }

        // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
        if (method === 'POST' && pathname === '/mode') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const rawMode = String(body.mode || 'default')
          const mode = (rawMode === 'default' ? 'workflow_driven' : rawMode) as DispatchMode
          const updated = roomManager.setDispatchMode(roomId, mode)
          if (updated) persistRoomState(roomId)
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: !!updated, room: updated }))
          return
        }

        // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
        if (method === 'POST' && pathname === '/agent/update') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const agentId = String(body.agentId || '').trim()
          if (!agentId) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'agentId is required' }))
            return
          }

          const existing=roomManager.getRoom(roomId)?.members.find(m=>m.id===agentId)
          if(existing){
            try{
              const models={llmConfig:{...existing.llmConfig,...body.llmConfig},resiliencePolicy:body.resiliencePolicy===undefined?existing.resiliencePolicy:body.resiliencePolicy}
              validateModels(models.llmConfig,models.resiliencePolicy)
              modelSettings.save(roomId,agentId,models)
            }catch(error){
              res.writeHead(400,{'Content-Type':'application/json; charset=utf-8'})
              res.end(JSON.stringify({error:error instanceof Error?error.message:String(error)}));return
            }
          }
          const updated = roomManager.updateAgentProfile(roomId, agentId, {
            name: body.name,
            avatar: body.avatar,
            title: body.title,
            roleDescription: body.roleDescription,
            systemPrompt: body.systemPrompt,
            llmConfig: body.llmConfig,
            resiliencePolicy: body.resiliencePolicy,
            permissions: body.permissions,
          })

          if (!updated) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Agent or room not found' }))
            return
          }

          persistRoomState(roomId)
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: true, agent: updated }))
          return
        }

        // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
        if (method === 'GET' && pathname === '/export') {
          const roomId = url.searchParams.get('id') || 'dev-team-alpha'
          const locale = url.searchParams.get('locale') === 'en-US' ? 'en-US' : 'zh-CN'
          const summary = roomManager.exportMeetingSummary(roomId, locale)
          res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' })
          res.end(summary)
          return
        }

        // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
        if (method === 'GET' && pathname === '/events') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          })
          res.write(`data: ${JSON.stringify({ type: 'connected', ts: Date.now() })}\n\n`)

          const unsubscribe = roomManager.subscribe((event) => {
            try {
              res.write(`data: ${JSON.stringify(event)}\n\n`)
            } catch {
              unsubscribe()
            }
          })

          const close = () => { unsubscribe(); streams.delete(close); res.end() }
          streams.add(close)
          req.on('close', close)
          return
        }

        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Endpoint not found' }))
      },
    })
  }, '@dsh-external/dsh-group-chat: webServer API')

  // Host plugin entry: REST API, message dispatch, workflow actions, and lifecycle-safe registration.
  const tools = registerGroupChatTools(roomManager, triggerAgentTurn)
  for (const tool of tools) {
    ctx.effect(() => ctx.tools.register(tool), `@dsh-external/dsh-group-chat: ${tool.name}`)
  }

  logger.info?.('[@dsh-external/dsh-group-chat] Plugin initialized with 6 roles, workflow pipeline and theme mappings.')
}



