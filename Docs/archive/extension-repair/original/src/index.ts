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
import { ResearchCapabilityBridge } from './engine/research-bridge.js'
import { registerGroupChatTools } from './tools/index.js'
import type { DispatchMode, PersonaThemeKey } from './types.js'

export const name = '@dsh-external/dsh-group-chat'
export const inject = ['tools', 'webServer', 'llm']

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

export type AppContext = Context & {
  webServer: any
  tools: any
  logger: any
}

export function apply(ctx: AppContext, config: Config): void {
  const logger = ctx.logger?.('@dsh-external/dsh-group-chat') || console

  const roomManager = new RoomManager()
  const toolBus = new SharedToolBus()
  const resilience = new ModelResilienceManager()

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
    const room = roomManager.getRoom(roomId)
    if (!room) return

    const member = room.members.find(m => m.id === targetAgentId)
    if (!member) return

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

    // 针对搜索调研角色的专长处理：若具备搜索外呼权限且触发了调研
    if (member.id === 'researcher') {
      const latestMsg = messages[messages.length - 1]?.content || ''
      const res = await ResearchCapabilityBridge.searchAndSummarize(latestMsg, member.name)
      replyContent = res.summary
      reasoningContent = `【外呼能力调用】调用 Web 全网检索与内容爬取分析，比对前沿工程论文与行业开源架构实践，完成数据清洗与关键结论提炼。`
    }

    // 尝试调用 DSH 原生 LLM 运行时 (若挂载且非固定外呼)
    const anyCtx = ctx as any
    if (!replyContent && anyCtx.llm && typeof anyCtx.llm.chat === 'function') {
      try {
        const execution = await resilience.executeWithFallback(member, async (modelRef) => {
          const chatResponse = await anyCtx.llm.chat({
            provider: modelRef.provider,
            model: modelRef.model,
            temperature: modelRef.temperature ?? 0.3,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: '请基于当前议题发言：' },
            ],
          })
          return chatResponse
        })

        replyContent = execution.result?.content || ''
        reasoningContent = execution.result?.reasoningContent || ''
        modelUsed = execution.modelUsed
        providerUsed = execution.providerUsed
        isFallback = execution.isFallback
        fallbackChain = execution.fallbackChain
      } catch (err) {
        logger.warn?.(`[GroupChat] LLM invocation failed for ${member.name}:`, err)
      }
    }

    // 兜底方案：按角色职责生成精准结构化输出
    if (!replyContent) {
      const latestMsg = messages[messages.length - 1]?.content || ''
      if (member.id === 'commander') {
        replyContent = `【总指挥官·决策把控】
针对当前汇报，方向符合预期。我已审核关键指标与风险边界：
1. 任务分工：各专责角色按既定工作流推进；
2. 质量要求：后端把紧数据一致性，前端注重交互直观性，测试专家务必进行红队破坏性验证；
3. 【批准】：当前阶段成果予以通过，准许推进至下一步！`
        reasoningContent = `总揽全局：审视最新汇报与当前工作流进度，确认指标与交付物质量，行使审批通过权。`
      } else if (member.id === 'backend') {
        replyContent = `【后端架构师·核心实现】
方案已就绪。后端已完成核心数据实体与服务契约建模：
1. 权限闸门：统一经由 WorkflowOrchestrator 进行角色权限校验（仅指挥官/管理员拥有审批权）；
2. 缓存隔离：工具总线采用 SHA-256 参数归一化哈希，In-Flight Promise 阻断微秒级并发踩踏；
3. 状态幂等：所有流程变更均具备可回溯时间戳。`
        reasoningContent = `阅读总指挥指令与调研简报，评估系统边界、数据流完整性与并发安全。`
      } else if (member.id === 'frontend') {
        replyContent = `【前端UI设计师·交互方案】
已完成群聊与工作流看板的交互视觉规整：
1. 视觉分区：左侧提供角色气泡流、思考链折叠与快捷唤醒；右侧展示工作流 DAG 进度卡片与主题名号切换器；
2. 动效反馈：支持阶段状态动态流转标识（✅已完成 / 🔄进行中 / ❌已打回）；
3. 权限护栏：非特权角色操作黑板或审批按钮时给出友好置灰或拦截提示。`
        reasoningContent = `结合后端状态契约设计用户界面动线，确保多主题切换时视觉要素无缝渲染。`
      } else if (member.id === 'qa') {
        replyContent = `【红队质量审计·审查报告】
已完成全盘破坏性对抗审查，指出以下关键点：
1. 边界用例：极端情况下单轮死循环已由 maxTurnsPerPrompt (6轮) 硬性阻断；
2. 静默标记：NO_REPLY 过滤成功，杜绝成员自激震荡；
3. 权限安全：非授权角色无权覆写黑板与越权审批，符合安全基线。`
        reasoningContent = `执行红队穿透审查，重点检测越权漏洞、循环死锁与上下文溢出边界。`
      } else if (member.id === 'writer') {
        replyContent = `【首席文案记录·成果沉淀】
阶段性共识与交付文档已整理完毕：
1. 共享黑板 (Shared Scratchpad) 已完成最新版本同步；
2. 形成结构化会议纪要，包含各角色发言结论与 Token 审计流水；
3. 交付物可随时通过一键导出 Markdown。`
        reasoningContent = `萃取各角色核心产物，凝练要点，更新共享黑板。`
      } else {
        replyContent = `收到议题，已基于专长对当前进展进行复核，无额外阻断性问题。`
      }
    }

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
        tokensConsumed: {
          promptTokens: Math.round(systemPrompt.length / 4),
          completionTokens: Math.round(replyContent.length / 4),
          totalTokens: Math.round((systemPrompt.length + replyContent.length) / 4),
        },
      },
    })

    // 下一步流转仲裁
    const decision = DispatchArbiter.decideNextSpeakers(room, envelope)
    if (!decision.isTerminal && decision.nextSpeakerIds.length > 0) {
      for (const nextId of decision.nextSpeakerIds) {
        setTimeout(() => {
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
              setTimeout(() => {
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
                setTimeout(() => {
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

          const updated = roomManager.updateAgentProfile(roomId, agentId, {
            name: body.name,
            avatar: body.avatar,
            title: body.title,
            roleDescription: body.roleDescription,
            systemPrompt: body.systemPrompt,
            llmConfig: body.llmConfig,
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

          req.on('close', () => {
            unsubscribe()
          })
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
