import type { WorkflowTaskStatus } from '../types.js'

export type StructuredAgentStatus = Extract<WorkflowTaskStatus, 'passed' | 'failed' | 'request_human'>

export interface StructuredAgentResult {
  status: StructuredAgentStatus
  summary?: string
  next?: string
  evidence?: string[]
  rawBlock: string
}

const STATUS_MAP: Record<string, StructuredAgentStatus> = {
  passed: 'passed',
  pass: 'passed',
  ok: 'passed',
  success: 'passed',
  failed: 'failed',
  fail: 'failed',
  error: 'failed',
  blocked: 'failed',
  request_human: 'request_human',
  human: 'request_human',
  need_human: 'request_human',
}

function normalizeStatus(value: string): StructuredAgentStatus | undefined {
  return STATUS_MAP[value.trim().toLowerCase().replace(/[\s-]+/g, '_')]
}

export function parseStructuredAgentResult(content: string): StructuredAgentResult | undefined {
  const fences = [...content.matchAll(/```\s*(?:agent-result|dsh-result)?\s*\n([\s\S]*?)```/gi)].map(match => match[1])
  const candidates = [content, ...fences]
  for (const candidate of candidates) {
    const statusLine = candidate.match(/^\s*RESULT_STATUS\s*:\s*([a-zA-Z_-]+)\s*$/im)
    if (!statusLine) continue
    const status = normalizeStatus(statusLine[1])
    if (!status) continue
    const summary = candidate.match(/^\s*SUMMARY\s*:\s*(.+)$/im)?.[1]?.trim()
    const next = candidate.match(/^\s*NEXT\s*:\s*(.+)$/im)?.[1]?.trim()
    const evidenceLine = candidate.match(/^\s*EVIDENCE\s*:\s*(.+)$/im)?.[1]?.trim()
    return {
      status,
      summary,
      next,
      evidence: evidenceLine ? evidenceLine.split(/\s*[,，;；]\s*/).filter(Boolean) : undefined,
      rawBlock: candidate.trim(),
    }
  }
  return undefined
}

export function stripStructuredAgentResult(content: string): string {
  let text = content.replace(/```\s*(?:agent-result|dsh-result)?\s*\n[\s\S]*?RESULT_STATUS\s*:[\s\S]*?```/gi, '').trim()
  const linePattern = /^\s*(RESULT_STATUS|SUMMARY|NEXT|EVIDENCE)\s*:\s*.*$/gim
  text = text.replace(linePattern, '').replace(/\n{3,}/g, '\n\n').trim()
  return text || content.trim()
}

export function inferAgentTaskStatus(content: string): StructuredAgentStatus {
  const parsed = parseStructuredAgentResult(content)
  if (parsed) return parsed.status
  const lowered = content.toLowerCase()
  if (lowered.includes('request_human') || content.includes('需要人工')) return 'request_human'
  if (lowered.includes('fail') || content.includes('失败') || content.includes('阻断')) return 'failed'
  return 'passed'
}

export const STRUCTURED_AGENT_RESULT_PROMPT = `【结构化结果协议 / Structured Agent Result】
如果你正在处理 Assignment 或 WorkflowTask，正文先正常给用户/主 Agent 看；末尾追加一个可解析结果块：
\`\`\`agent-result
RESULT_STATUS: passed | failed | request_human
SUMMARY: 一句话说明完成结果
NEXT: 下一步建议或需要谁处理
EVIDENCE: 可选，关键产物/命令/链接/任务 ID
\`\`\`
规则：完成且可验收用 passed；存在阻断/验证失败用 failed；缺少用户输入/授权/关键信息用 request_human。若只需静默，仍然只输出 NO_REPLY。`
