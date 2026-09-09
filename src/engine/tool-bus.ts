/**
 * Shared tool bus with deterministic cache keys, in-flight dedupe, result trimming, and cache cleanup.
 */

import { createHash } from 'node:crypto'
import type { ToolCacheEntry } from '../types.js'

export interface ToolBusOptions {
  /**
 * Shared tool bus with deterministic cache keys, in-flight dedupe, result trimming, and cache cleanup.
 */
  cacheTtlMs?: number
  /**
 * Shared tool bus with deterministic cache keys, in-flight dedupe, result trimming, and cache cleanup.
 */
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
 * Shared tool bus with deterministic cache keys, in-flight dedupe, result trimming, and cache cleanup.
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
 * Shared tool bus with deterministic cache keys, in-flight dedupe, result trimming, and cache cleanup.
 */
  public generateHash(roomId: string, toolName: string, args: unknown): string {
    const normalizedArgs = this.normalizeArgs(args)
    const rawKey = `${roomId}:${toolName.trim().toLowerCase()}:${normalizedArgs}`
    return createHash('sha256').update(rawKey).digest('hex')
  }

  /**
 * Shared tool bus with deterministic cache keys, in-flight dedupe, result trimming, and cache cleanup.
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
 * Shared tool bus with deterministic cache keys, in-flight dedupe, result trimming, and cache cleanup.
 */
  public async executeTool(
    roomId: string,
    toolName: string,
    args: unknown,
    executor: () => Promise<unknown>
  ): Promise<{ result: unknown; fromCache: boolean; inFlightReused: boolean }> {
    const hash = this.generateHash(roomId, toolName, args)
    const now = Date.now()

    // Shared tool bus with deterministic cache keys, in-flight dedupe, result trimming, and cache cleanup.
    const cached = this.cache.get(hash)
    if (cached && now - cached.timestamp < this.cacheTtlMs) {
      cached.hits += 1
      return { result: cached.result, fromCache: true, inFlightReused: false }
    }

    // Shared tool bus with deterministic cache keys, in-flight dedupe, result trimming, and cache cleanup.
    const running = this.inFlight.get(hash)
    if (running) {
      const result = await running
      return { result, fromCache: false, inFlightReused: true }
    }

    // Shared tool bus with deterministic cache keys, in-flight dedupe, result trimming, and cache cleanup.
    const promise = (async () => {
      try {
        const rawResult = await executor()
        const pruned = this.pruneResult(rawResult)
        // Shared tool bus with deterministic cache keys, in-flight dedupe, result trimming, and cache cleanup.
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
 * Shared tool bus with deterministic cache keys, in-flight dedupe, result trimming, and cache cleanup.
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
 * Shared tool bus with deterministic cache keys, in-flight dedupe, result trimming, and cache cleanup.
 */
  public clear(): void {
    this.cache.clear()
    this.inFlight.clear()
  }
}
