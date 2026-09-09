import {homedir} from 'node:os'
import {join} from 'node:path'
import {ModelSettingsStore, validateModels} from './engine/model-settings.js'
/**
 * @dsh-external/dsh-group-chat — DSH 多 Agent 角色协同与群聊插件
 * 遵循 Cordis 微内核架构、生命周期 Effect 与安全边界
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { RoomManager } from './engine/room-manager.js'
import { SharedToolBus } from './engine/tool-bus.js'
import { ModelResilienceManager } from './engine/resilience.js'
import { DispatchArbiter } from './engine/arbiter.js'
import { ContextProjection } from './engine/projection.js'
import { WorkflowOrchestrator } from './engine/workflow-orchestrator.js'
import { runMemberTurn, type RuntimeContext } from './engine/agent-runtime.js'
import { registerGroupChatTools } from './tools/index.js'
import type { DispatchMode, PersonaThemeKey } from './types.js'

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

  const roomManager = new RoomManager()
  const modelSettings = new ModelSettingsStore(join(homedir(), '.dsh', 'dsh-group-chat', 'model-settings.json'))
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

  // 辅助解析 POST 请求体的 JSON 数据
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
   * 触发单个 Agent 轮次发言
   */
  const triggerAgentTurn = async (roomId: string, targetAgentId: string): Promise<void> => {
    if (lifetime.signal.aborted) return
    const room = roomManager.getRoom(roomId)
    if (!room) return

    const member = room.members.find(m => m.id === targetAgentId)
    if (!member) return

    roomManager.broadcast({type:'agent:status',roomId,payload:{agentId:member.id,name:member.name,avatar:member.avatar,title:member.title,status:'running',startedAt:Date.now()},timestamp:Date.now()})

    // 检查互动轮次
    const currentRound = roomManager.incrementInteractionRound(roomId)
    if (currentRound > room.safetyPolicy.maxTurnsPerPrompt) {
      logger.info?.(`[GroupChat] Room ${roomId} reached max turns (${room.safetyPolicy.maxTurnsPerPrompt}), circuit tripped.`)
      roomManager.broadcast({
        type: 'circuit_breaker:tripped',
        roomId,
        payload: {
          round: currentRound,
          max: room.safetyPolicy.maxTurnsPerPrompt,
          reason: '已达到单次指令最大自主协作轮次限制，触发硬性熔断。',
        },
        timestamp: Date.now(),
      })
      return
    }

    const messages = roomManager.getMessages(roomId)
    const systemPrompt = ContextProjection.assembleSystemPrompt(member, room, messages)

    let replyContent = ''
    let reasoningContent = ''
    let modelUsed = member.llmConfig.model
    let providerUsed = member.llmConfig.provider
    let isFallback = false
    let fallbackChain: string[] = []

    try {
      const profile = member.llmConfig.provider && member.llmConfig.model ? member : {
        ...member, llmConfig: { ...ctx.agentDefaultModel.currentSelection(), temperature: member.llmConfig.temperature },
      }
      const execution = await resilience.executeWithFallback(profile, (modelRef, signal) =>
        runMemberTurn(ctx, modelRef, systemPrompt, signal), lifetime.signal)
      replyContent = execution.result.content
      modelUsed = execution.result.modelUsed
      providerUsed = execution.result.providerUsed
      isFallback = execution.isFallback
      fallbackChain = execution.fallbackChain
      try{modelSettings.remember({provider:providerUsed,model:modelUsed})}catch(error){logger.warn?.('最近模型记录保存失败',error)}
    } catch (err) {
      if (lifetime.signal.aborted) return
      const message = err instanceof Error ? err.message : String(err)
      logger.warn?.(`[GroupChat] ${member.name}: ${message}`)
      roomManager.broadcast({ type: 'error:notice', roomId,
        payload: { agentId: member.id, message }, timestamp: Date.now() })
      roomManager.broadcast({type:'agent:status',roomId,payload:{agentId:member.id,name:member.name,avatar:member.avatar,title:member.title,status:'error',message},timestamp:Date.now()})
      roomManager.addMessage(roomId, {
        roomId, sender: { kind: 'system', id: 'group-chat', name: '群聊系统', avatar: '⚠️' },
        content: `${member.name} 模型调用失败：${message}`, mentions: [], metadata: { systemNotice: 'model-error' },
      })
      return
    }
    if (lifetime.signal.aborted) return
    roomManager.broadcast({type:'agent:status',roomId,payload:{agentId:member.id,name:member.name,avatar:member.avatar,title:member.title,status:'complete',modelUsed,providerUsed,finishedAt:Date.now()},timestamp:Date.now()})

    // 检查是否为静默标记 (NO_REPLY)
    if (DispatchArbiter.isSilenceToken(replyContent, room.safetyPolicy.silenceToken)) {
      logger.info?.(`[GroupChat] Agent ${member.name} (${member.id}) emitted NO_REPLY, silenced.`)
      return
    }

    // 提取可能的 @ 提及
    const { targetAgentIds } = DispatchArbiter.extractMentions(replyContent, room.members)

    // 添加并持久化 Agent 发言
    const envelope = roomManager.addMessage(roomId, {
      roomId,
      sender: {
        kind: 'agent',
        id: member.id,
        name: member.name,
        avatar: member.avatar,
        color: member.color,
      },
      content: replyContent,
      reasoningContent,
      mentions: targetAgentIds,
      metadata: {
        modelUsed,
        providerUsed,
        isFallback,
        fallbackChain,

      },
    })

    // 下一步流转仲裁
    const decision = DispatchArbiter.decideNextSpeakers(room, envelope)
    if (!decision.isTerminal && decision.nextSpeakerIds.length > 0) {
      for (const nextId of decision.nextSpeakerIds) {
        schedule(() => {
          void triggerAgentTurn(roomId, nextId).catch(err => {
            logger.warn?.(`[GroupChat] Turn error for ${nextId}:`, err)
          })
        }, 1200)
      }
    }
  }

  // 挂载 Host WebServer REST API
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

        if(method==='GET' && pathname==='/models'){
          const groups=await Promise.all(ctx.llm.listProviders().map(async provider=>{
            try{return {...provider,models:await ctx.llm.listModels(provider.id)}}
            catch{return {...provider,models:[],error:'模型目录加载失败，可手动输入 ID'}}
          }))
          res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'})
          res.end(JSON.stringify({groups,recent:modelSettings.recent(),current:ctx.agentDefaultModel.currentSelection()}));return
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

        // 1. 获取所有房间
        if (method === 'GET' && (pathname === '/rooms' || pathname === '')) {
          const rooms = roomManager.getAllRooms()
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ rooms }))
          return
        }

        // 2. 获取单个房间详情与消息
        if (method === 'GET' && pathname === '/room') {
          const roomId = url.searchParams.get('id') || 'dev-team-alpha'
          const room = roomManager.getRoom(roomId)
          if (!room) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Room not found' }))
            return
          }
          const messages = roomManager.getMessages(roomId)
          const ledger = roomManager.getLedger(roomId)
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ room, messages, ledger }))
          return
        }

        // 3. 发送消息接口
        if (method === 'POST' && pathname === '/message') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const content = String(body.content || '').trim()

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

          // 记录人类消息
          const envelope = roomManager.addMessage(roomId, {
            roomId,
            sender: {
              kind: 'user',
              id: 'user',
              name: '人类负责人',
              avatar: '👤',
            },
            content,
            mentions: targetAgentIds,
            metadata: {},
          })

          roomManager.resetInteractionRound(roomId)
          const decision = DispatchArbiter.decideNextSpeakers(room, envelope)

          if (!decision.isTerminal && decision.nextSpeakerIds.length > 0) {
            for (const targetId of decision.nextSpeakerIds) {
              schedule(() => {
                void triggerAgentTurn(roomId, targetId).catch(console.error)
              }, 600)
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: true, message: envelope, decision }))
          return
        }

        // 4. 更新共享黑板接口（带权限校验）
        if (method === 'POST' && pathname === '/scratchpad') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const scratchpad = String(body.scratchpad || '')
          const operator = body.operatorRoleId || 'commander'

          const result = roomManager.updateScratchpad(roomId, scratchpad, operator)
          res.writeHead(result.success ? 200 : 403, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify(result))
          return
        }

        // 5. 切换名号主题接口
        if (method === 'POST' && pathname === '/theme') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const theme = (body.theme || 'modern') as PersonaThemeKey

          const updated = roomManager.switchTheme(roomId, theme)
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: !!updated, room: updated }))
          return
        }

        // 6. 工作流推进/驳回接口
        if (method === 'POST' && pathname === '/workflow/action') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const action = body.action as 'advance' | 'reject'
          const room = roomManager.getRoom(roomId)

          if (!room) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Room not found' }))
            return
          }

          if (action === 'advance') {
            const result = WorkflowOrchestrator.advanceStage(room, body.approverRoleId || 'commander', body.summary)
            roomManager.saveRoom(room)
            if (result.stage) {
              for (const nextRole of result.stage.assignedRoleIds) {
                schedule(() => {
                  void triggerAgentTurn(roomId, nextRole).catch(console.error)
                }, 600)
              }
            }
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify(result))
            return
          } else if (action === 'reject') {
            const result = WorkflowOrchestrator.rejectStage(room, 'commander', body.reason || '未达标要求重新修改')
            roomManager.saveRoom(room)
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify(result))
            return
          }
        }

        // 7. 切换调度模式接口
        if (method === 'POST' && pathname === '/mode') {
          const body = await readJsonBody(req)
          const roomId = body.roomId || 'dev-team-alpha'
          const mode = body.mode as DispatchMode
          const updated = roomManager.setDispatchMode(roomId, mode)
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: !!updated, room: updated }))
          return
        }

        // 7.1 自定义更新角色设定与头像图片上传接口
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

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
          res.end(JSON.stringify({ success: true, agent: updated }))
          return
        }

        // 8. 导出纪要接口
        if (method === 'GET' && pathname === '/export') {
          const roomId = url.searchParams.get('id') || 'dev-team-alpha'
          const summary = roomManager.exportMeetingSummary(roomId)
          res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' })
          res.end(summary)
          return
        }

        // 9. SSE 实时事件流
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

  // 注册群聊工具集
  const tools = registerGroupChatTools(roomManager, triggerAgentTurn)
  for (const tool of tools) {
    ctx.effect(() => ctx.tools.register(tool), `@dsh-external/dsh-group-chat: ${tool.name}`)
  }

  logger.info?.('[@dsh-external/dsh-group-chat] Plugin initialized with 6 roles, workflow pipeline and theme mappings.')
}


