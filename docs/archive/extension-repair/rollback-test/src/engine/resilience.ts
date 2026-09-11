/**
 * DSH Group Chat - 模型调用弹性级联降级与容灾治理 (Resilience & Model Fallback)
 * 借鉴 OmniRoute 与 DSH 原生瀑布流设计
 */

import type { AgentProfile, ModelRef } from '../types.js'

export interface ModelExecutionResult<T> {
  result: T
  modelUsed: string
  providerUsed: string
  isFallback: boolean
  fallbackChain: string[]
}

export class ModelResilienceManager {
  /** 处于 429 冷却期的模型映射: key -> 恢复时间戳 */
  private cooldownMap = new Map<string, number>()

  private makeKey(provider: string, model: string): string {
    return `${provider}:${model}`
  }

  /**
   * 检查模型当前是否处于 429 冷却状态
   */
  public isModelInCooldown(provider: string, model: string): boolean {
    const key = this.makeKey(provider, model)
    const expiresAt = this.cooldownMap.get(key)
    if (!expiresAt) return false

    if (Date.now() > expiresAt) {
      this.cooldownMap.delete(key)
      return false
    }
    return true
  }

  /**
   * 将模型标记为 429 冷却
   */
  public markCooldown(provider: string, model: string, durationMs = 30000): void {
    const key = this.makeKey(provider, model)
    this.cooldownMap.set(key, Date.now() + durationMs)
  }

  /**
   * 获取所有可用的备选模型序列（排除冷却中的模型）
   */
  public getCandidateModels(profile: AgentProfile): ModelRef[] {
    const candidates: ModelRef[] = [profile.llmConfig]

    if (profile.resiliencePolicy?.fallbackModels) {
      for (const m of profile.resiliencePolicy.fallbackModels) {
        if (!candidates.some(c => c.provider === m.provider && c.model === m.model)) {
          candidates.push(m)
        }
      }
    }

    // 优先过滤掉仍处于冷却期的模型（除非全部冷却，则保留作为最后尝试）
    const available = candidates.filter(m => !this.isModelInCooldown(m.provider, m.model))
    return available.length > 0 ? available : candidates
  }

  /**
   * 执行具备容灾与级联降级能力的 LLM 调用
   */
  public async executeWithFallback<T>(
    profile: AgentProfile,
    caller: (modelRef: ModelRef) => Promise<T>
  ): Promise<ModelExecutionResult<T>> {
    const candidates = this.getCandidateModels(profile)
    const policy = profile.resiliencePolicy ?? {
      fallbackModels: [],
      maxRetriesPerModel: 2,
      retryBackoffMs: 1000,
      timeoutMs: 30000,
    }

    const fallbackChain: string[] = []
    let lastError: Error | null = null

    for (let i = 0; i < candidates.length; i++) {
      const currentModel = candidates[i]
      const modelTag = `${currentModel.provider}/${currentModel.model}`
      fallbackChain.push(modelTag)

      const isPrimary = i === 0

      // 针对每个模型可执行的重试循环
      for (let attempt = 0; attempt <= policy.maxRetriesPerModel; attempt++) {
        try {
          // 超时包装
          const resultPromise = caller(currentModel)
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Model call timed out after ${policy.timeoutMs}ms (${modelTag})`))
            }, policy.timeoutMs)
          })

          const result = await Promise.race([resultPromise, timeoutPromise])

          return {
            result,
            modelUsed: currentModel.model,
            providerUsed: currentModel.provider,
            isFallback: !isPrimary,
            fallbackChain,
          }
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error(String(err))
          lastError = error
          const msg = error.message.toLowerCase()

          // 1. 检查是否为 429 限流
          if (msg.includes('429') || msg.includes('rate limit') || msg.includes('quota')) {
            this.markCooldown(currentModel.provider, currentModel.model)
            // 429 不在当前模型重试，立即触发切换下一模型
            break
          }

          // 2. 超时或 500/502/504 网络故障：指数退避重试
          if (attempt < policy.maxRetriesPerModel) {
            const delay = policy.retryBackoffMs * Math.pow(2, attempt)
            await new Promise(r => setTimeout(r, delay))
          }
        }
      }
    }

    throw new Error(
      `[Resilience] 所有候选模型均调用失败: [${fallbackChain.join(' -> ')}]. 最后错误: ${lastError?.message}`
    )
  }
}
