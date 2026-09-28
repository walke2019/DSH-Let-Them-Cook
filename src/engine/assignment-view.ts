import type { AssignmentEnvelope, AssignmentStatus } from '../types.js'

export interface AssignmentSummary {
  readonly running: readonly AssignmentEnvelope[]
  readonly queued: readonly AssignmentEnvelope[]
  readonly active: readonly AssignmentEnvelope[]
  readonly attention: readonly AssignmentEnvelope[]
  readonly completed: readonly AssignmentEnvelope[]
  readonly issues: readonly AssignmentEnvelope[]
  readonly history: readonly AssignmentEnvelope[]
  readonly counts: {
    readonly running: number
    readonly queued: number
    readonly active: number
    readonly attention: number
    readonly completed: number
    readonly issues: number
    readonly history: number
  }
}

function assertNever(status: never): never {
  throw new Error(`Unsupported assignment status: ${String(status)}`)
}

export function assignmentBucket(status: AssignmentStatus): 'running' | 'queued' | 'attention' | 'completed' | 'issues' {
  switch (status) {
    case 'running': return 'running'
    case 'queued': return 'queued'
    case 'blocked': return 'attention'
    case 'completed': return 'completed'
    case 'failed':
    case 'cancelled': return 'issues'
    default: return assertNever(status)
  }
}

export function summarizeAssignments(assignments: readonly AssignmentEnvelope[] = []): AssignmentSummary {
  const running: AssignmentEnvelope[] = []
  const queued: AssignmentEnvelope[] = []
  const attention: AssignmentEnvelope[] = []
  const completed: AssignmentEnvelope[] = []
  const issues: AssignmentEnvelope[] = []
  for (const assignment of assignments) {
    switch (assignmentBucket(assignment.status)) {
      case 'running': running.push(assignment); break
      case 'queued': queued.push(assignment); break
      case 'attention': attention.push(assignment); break
      case 'completed': completed.push(assignment); break
      case 'issues': issues.push(assignment); break
    }
  }
  const active = [...running, ...queued]
  const history = [...completed, ...issues].sort((left, right) => right.updatedAt - left.updatedAt)
  return {
    running, queued, active, attention, completed, issues, history,
    counts: {
      running: running.length,
      queued: queued.length,
      active: active.length,
      attention: attention.length,
      completed: completed.length,
      issues: issues.length,
      history: history.length,
    },
  }
}
