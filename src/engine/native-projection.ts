declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    'tool-workflow/run-start': { runId: string; name: string }
    'tool-workflow/agent-start': { runId: string; seq: number; label: string; phase?: string; childId: string }
    'tool-workflow/agent-end': { runId: string; seq: number; outcome: 'completed' | 'failed' | 'cancelled' }
    'tool-workflow/run-end': { runId: string; stopReason: 'completed' | 'cancelled' | 'error' }
  }
}

export {}
