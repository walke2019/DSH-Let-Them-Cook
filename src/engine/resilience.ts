/**
 * Resilient model invocation with fallback chains, 429 cooldowns, timeout handling, and retry backoff.
 */

import type { AgentProfile, ModelRef, RoleModelHint } from '../types.js'

export interface ModelAttemptRecord {
  provider: string
  model: string
  attempt: number
  elapsedMs: number
  error?: string
}

export interface ModelExecutionResult<T> {
  result: T
  modelUsed: string
  providerUsed: string
  isFallback: boolean
  fallbackChain: string[]
  attempts: ModelAttemptRecord[]
  totalElapsedMs: number
}

export class ModelResilienceManager {
  /**
 * Resilient model invocation with fallback chains, 429 cooldowns, timeout handling, and retry backoff.
 */
  private cooldownMap = new Map<string, number>()

  private makeKey(provider: string, model: string): string {
    return `${provider}:${model}`
  }

  /**
 * Resilient model invocation with fallback chains, 429 cooldowns, timeout handling, and retry backoff.
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
 * Resilient model invocation with fallback chains, 429 cooldowns, timeout handling, and retry backoff.
 */
  public markCooldown(provider: string, model: string, durationMs = 30000): void {
    const key = this.makeKey(provider, model)
    this.cooldownMap.set(key, Date.now() + durationMs)
  }

  /**
 * Resilient model invocation with fallback chains, 429 cooldowns, timeout handling, and retry backoff.
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

    // Resilient model invocation with fallback chains, 429 cooldowns, timeout handling, and retry backoff.
    const available = candidates.filter(m => !this.isModelInCooldown(m.provider, m.model))
    return available.length > 0 ? available : candidates
  }

  private effectiveTimeoutMs(policyTimeout: number, hint?: RoleModelHint): number {
    const minByLatency = hint?.latencyPreference === 'patient' ? 120000 : hint?.latencyPreference === 'normal' ? 90000 : 45000
    return Math.max(policyTimeout || 30000, minByLatency)
  }

  /**
 * Resilient model invocation with fallback chains, 429 cooldowns, timeout handling, and retry backoff.
 */
  public async executeWithFallback<T>(
    profile: AgentProfile,
    caller: (modelRef: ModelRef, signal: AbortSignal) => Promise<T>,
    signal: AbortSignal = new AbortController().signal
  ): Promise<ModelExecutionResult<T>> {
    const candidates = this.getCandidateModels(profile)
    const policy = profile.resiliencePolicy ?? {
      fallbackModels: [],
      maxRetriesPerModel: 2,
      retryBackoffMs: 1000,
      timeoutMs: 30000,
    }

    const fallbackChain: string[] = []
    const attempts: ModelAttemptRecord[] = []
    const startedAt = Date.now()
    const timeoutMs = this.effectiveTimeoutMs(policy.timeoutMs, profile.modelHint)
    let lastError: Error | null = null

    for (let i = 0; i < candidates.length; i++) {
      const currentModel = candidates[i]
      const modelTag = `${currentModel.provider}/${currentModel.model}`
      fallbackChain.push(modelTag)

      const isPrimary = currentModel.provider === profile.llmConfig.provider && currentModel.model === profile.llmConfig.model

      // Resilient model invocation with fallback chains, 429 cooldowns, timeout handling, and retry backoff.
      for (let attempt = 0; attempt <= policy.maxRetriesPerModel; attempt++) {
        signal.throwIfAborted()
        const controller = new AbortController()
        const abort = () => controller.abort(signal.reason)
        signal.addEventListener('abort', abort, { once: true })
        const attemptStartedAt = Date.now()
        const timer = setTimeout(() => controller.abort(new Error(`Model call timed out after ${timeoutMs}ms (${modelTag})`)), timeoutMs)
        try {
          // The caller observes cancellation and disposes its agent before a retry.
          const result = await caller(currentModel, controller.signal)
          controller.signal.throwIfAborted()

          return {
            result,
            modelUsed: currentModel.model,
            providerUsed: currentModel.provider,
            isFallback: !isPrimary,
            fallbackChain,
            attempts: [...attempts, { provider: currentModel.provider, model: currentModel.model, attempt: attempt + 1, elapsedMs: Date.now() - attemptStartedAt }],
            totalElapsedMs: Date.now() - startedAt,
          }
        } catch (err: unknown) {
          signal.throwIfAborted()
          const error = err instanceof Error ? err : new Error(String(err))
          lastError = error
          attempts.push({ provider: currentModel.provider, model: currentModel.model, attempt: attempt + 1, elapsedMs: Date.now() - attemptStartedAt, error: error.message })
          const msg = error.message.toLowerCase()

          // Resilient model invocation with fallback chains, 429 cooldowns, timeout handling, and retry backoff.
          if (msg.includes('429') || msg.includes('rate limit') || msg.includes('quota')) {
            this.markCooldown(currentModel.provider, currentModel.model)
            // Resilient model invocation with fallback chains, 429 cooldowns, timeout handling, and retry backoff.
            break
          }

          // Resilient model invocation with fallback chains, 429 cooldowns, timeout handling, and retry backoff.
          if (attempt < policy.maxRetriesPerModel) {
            const delay = policy.retryBackoffMs * Math.pow(2, attempt)
            await new Promise<void>((resolve, reject) => {
              const stop = () => { clearTimeout(wait); signal.removeEventListener('abort', stop); reject(signal.reason) }
              const wait = setTimeout(() => { signal.removeEventListener('abort', stop); resolve() }, delay)
              signal.addEventListener('abort', stop, { once: true })
              if (signal.aborted) stop()
            })
          }
        } finally {
          clearTimeout(timer)
          signal.removeEventListener('abort', abort)
        }
      }
    }

    throw new Error(
      `[Resilience] 所有候选模型均调用失败: [${fallbackChain.join(' -> ')}]. 总耗时 ${Date.now() - startedAt}ms；尝试 ${attempts.length} 次；最后错误: ${lastError?.message}`
    )
  }
}
