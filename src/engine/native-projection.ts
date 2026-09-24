import type { SessionEvent } from '@deepseek-ai/dsh-session'

export interface LetThemCookProjectionRoomView {
  roomId: string
  title: string
  pendingTransactionCount: number
  awaitingUserDecision: boolean
  workflowStage?: string
  workflowStatus?: string
  assignmentCount: number
  openAssignmentCount: number
  ledgerTotalTokens: number
  updatedAt: number
}

export interface LetThemCookProjectionView {
  rooms: Record<string, LetThemCookProjectionRoomView>
}

interface LetThemCookProjectionState extends LetThemCookProjectionView {}

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    'let-them-cook/room-state': LetThemCookProjectionRoomView
    'tool-workflow/run-start': { runId: string; name: string }
    'tool-workflow/agent-start': { runId: string; seq: number; label: string; phase?: string; childId: string }
    'tool-workflow/agent-end': { runId: string; seq: number; outcome: 'completed' | 'failed' | 'cancelled' }
    'tool-workflow/run-end': { runId: string; stopReason: 'completed' | 'cancelled' | 'error' }
  }
}

function assertFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`letThemCook projection ${field} must be a finite number`)
  return value
}

function assertString(value: unknown, field: string): string {
  if (typeof value !== 'string') throw new Error(`letThemCook projection ${field} must be a string`)
  return value
}

function assertOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string') throw new Error(`letThemCook projection ${field} must be a string when present`)
  return value
}

function assertBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`letThemCook projection ${field} must be a boolean`)
  return value
}

function parseRoomProjection(value: unknown): LetThemCookProjectionRoomView {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('letThemCook projection room must be an object')
  const source = value as Record<string, unknown>
  return {
    roomId: assertString(source.roomId, 'roomId'),
    title: assertString(source.title, 'title'),
    pendingTransactionCount: assertFiniteNumber(source.pendingTransactionCount, 'pendingTransactionCount'),
    awaitingUserDecision: assertBoolean(source.awaitingUserDecision, 'awaitingUserDecision'),
    workflowStage: assertOptionalString(source.workflowStage, 'workflowStage'),
    workflowStatus: assertOptionalString(source.workflowStatus, 'workflowStatus'),
    assignmentCount: assertFiniteNumber(source.assignmentCount, 'assignmentCount'),
    openAssignmentCount: assertFiniteNumber(source.openAssignmentCount, 'openAssignmentCount'),
    ledgerTotalTokens: assertFiniteNumber(source.ledgerTotalTokens, 'ledgerTotalTokens'),
    updatedAt: assertFiniteNumber(source.updatedAt, 'updatedAt'),
  }
}

function parseLetThemCookProjection(value: unknown): LetThemCookProjectionState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('letThemCook projection state must be an object')
  const rooms = (value as Record<string, unknown>).rooms
  if (!rooms || typeof rooms !== 'object' || Array.isArray(rooms)) throw new Error('letThemCook projection rooms must be an object')
  const parsed: Record<string, LetThemCookProjectionRoomView> = {}
  for (const [key, room] of Object.entries(rooms)) parsed[key] = parseRoomProjection(room)
  return { rooms: parsed }
}

const letThemCookProjectionSchema = { parse: parseLetThemCookProjection }

export const letThemCookProjectionDefinition = {
  key: 'letThemCook' as const,
  stateVersion: 1,
  stateSchema: letThemCookProjectionSchema,
  init: (): LetThemCookProjectionState => ({ rooms: {} }),
  apply: (state: NoInfer<LetThemCookProjectionState>, event: SessionEvent): LetThemCookProjectionState => {
    if (event.type !== 'let-them-cook/room-state') return state
    const data = parseRoomProjection(event.data)
    return { rooms: { ...state.rooms, [data.roomId]: data } }
  },
  wire: {
    viewSchema: letThemCookProjectionSchema,
    view: (state: NoInfer<LetThemCookProjectionState>): LetThemCookProjectionView => state,
  },
}
