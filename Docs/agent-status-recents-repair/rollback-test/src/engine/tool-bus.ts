/**
 * DSH Group Chat - 共享工具总线与请求防重复并发执行器 (Shared Tool Bus)
 */

import { createHash } from 'node:crypto'
import type { ToolCacheEntry } from '../types.js'

export interface ToolBusOptions {
  /** 缓存默认有效期（毫秒），默认 5 分钟 */
  cacheTtlMs?: number
  /** 工具返回大文本结果的保留上限字符数，默认 2000 字 */
  maxResultChars?: number
}

export class SharedToolBus {
  private cache = new Map<string, ToolCacheEntry>()
  private inFlight = new Map<string, Promise<unknown>>()
  private cacheTtlMs: number
  private maxResultChars: number

  constructor(options: ToolBusOptions = {}) {
    this.cacheTtlMs = options.cacheTtlMs ?? 5 * 60 * 1000
    this.maxResultChars = options.maxResultChars ?? 2000
  }

  /**
   * 对入参对象进行字典序排序与归一化
   */
  public normalizeArgs(args: unknown): string {
    if (args === null || typeof args !== 'object') {
      return String(args ?? '').trim().toLowerCase()
    }

    if (Array.isArray(args)) {
      return JSON.stringify(args.map(item => this.normalizeArgs(item)))
    }

    const sortedObj: Record<string, unknown> = {}
    const keys = Object.keys(args as Record<string, unknown>).sort()
    for (const key of keys) {
      const val = (args as Record<string, unknown>)[key]
      if (typeof val === 'string') {
        sortedObj[key] = val.trim()
      } else {
        sortedObj[key] = val
      }
    }
    return JSON.stringify(sortedObj)
  }

  /**
   * 生成全局确定性哈希
   */
  public generateHash(roomId: string, toolName: string, args: unknown): string {
    const normalizedArgs = this.normalizeArgs(args)
    const rawKey = `${roomId}:${toolName.trim().toLowerCase()}:${normalizedArgs}`
    return createHash('sha256').update(rawKey).digest('hex')
  }

  /**
   * 结果剪枝与规整（Token 节俭协议）
   */
  public pruneResult(result: unknown): unknown {
    if (typeof result === 'string') {
      if (result.length > this.maxResultChars) {
        return `${result.slice(0, this.maxResultChars)}\n... [Tool Output Pruned: ${result.length - this.maxResultChars} chars omitted for token thrift]`
      }
      return result
    }
    return result
  }

  /**
   * 拦截并执行工具调用，自动应用缓存与并发防踩踏
   */
  public async executeTool(
    roomId: string,
    toolName: string,
    args: unknown,
    executor: () => Promise<unknown>
  ): Promise<{ result: unknown; fromCache: boolean; inFlightReused: boolean }> {
    const hash = this.generateHash(roomId, toolName, args)
    const now = Date.now()

    // 1. 检查缓存命中
    const cached = this.cache.get(hash)
    if (cached && now - cached.timestamp < this.cacheTtlMs) {
      cached.hits += 1
      return { result: cached.result, fromCache: true, inFlightReused: false }
    }

    // 2. 检查并发 In-Flight 请求
    const running = this.inFlight.get(hash)
    if (running) {
      const result = await running
      return { result, fromCache: false, inFlightReused: true }
    }

    // 3. 真正执行调用，并保护并发 Promise
    const promise = (async () => {
      try {
        const rawResult = await executor()
        const pruned = this.pruneResult(rawResult)
        // 写入缓存池
        this.cache.set(hash, {
          hashKey: hash,
          toolName,
          normalizedArgs: this.normalizeArgs(args),
          result: pruned,
          timestamp: Date.now(),
          hits: 0,
        })
        return pruned
      } finally {
        this.inFlight.delete(hash)
      }
    })()

    this.inFlight.set(hash, promise)
    const result = await promise
    return { result, fromCache: false, inFlightReused: false }
  }

  /**
   * 清理过期缓存
   */
  public gc(): void {
    const now = Date.now()
    for (const [hash, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheTtlMs) {
        this.cache.delete(hash)
      }
    }
  }

  /**
   * 清空所有缓存
   */
  public clear(): void {
    this.cache.clear()
    this.inFlight.clear()
  }
}
