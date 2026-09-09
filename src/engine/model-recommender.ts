import type {ModelCapability, ModelRef, RoleModelHint} from '../types.js'

export interface CatalogProvider { id: string; name: string; models: { id: string; name: string }[]; error?: string }
export interface ModelRecommendation extends ModelRef {
  name: string
  groupName: string
  score: number
  matchedCapabilities: ModelCapability[]
  reasons: string[]
  source: 'manual' | 'recent' | 'catalog' | 'host_default'
}

const CAPABILITY_PATTERNS: Record<ModelCapability, RegExp[]> = {
  reasoning: [/reason/i, /thinking/i, /r1/i, /o[13]/i, /opus/i, /sonnet/i, /grok/i, /pro/i],
  coding: [/code/i, /coder/i, /codex/i, /dev/i, /program/i, /qwen.*coder/i],
  tool_use: [/tool/i, /function/i, /agent/i, /codex/i, /harness/i, /sonnet/i, /gpt/i],
  web_research: [/search/i, /web/i, /browser/i, /research/i, /deep.?research/i, /pro/i],
  data_extraction: [/extract/i, /json/i, /structured/i, /qwen/i, /deepseek/i],
  ui_design: [/vision/i, /ui/i, /design/i, /image/i, /gemini/i, /gpt/i, /claude/i],
  writing: [/chat/i, /instruct/i, /write/i, /flash/i, /haiku/i, /mini/i, /gemini/i],
  qa_audit: [/reason/i, /thinking/i, /r1/i, /audit/i, /critic/i, /opus/i, /sonnet/i],
  long_context: [/long/i, /context/i, /128k/i, /200k/i, /1m/i, /gemini/i, /claude/i, /gpt/i],
  fast_reply: [/flash/i, /mini/i, /haiku/i, /lite/i, /fast/i, /spark/i],
  low_cost: [/mini/i, /lite/i, /haiku/i, /flash/i, /distill/i, /small/i],
}

function modelText(provider: string, model: string, name = '', groupName = ''): string {
  return `${provider} ${model} ${name} ${groupName}`
}

function detectCapabilities(provider: string, model: string, name = '', groupName = ''): ModelCapability[] {
  const text = modelText(provider, model, name, groupName)
  return (Object.keys(CAPABILITY_PATTERNS) as ModelCapability[]).filter(cap => CAPABILITY_PATTERNS[cap].some(pattern => pattern.test(text)))
}

function scoreLatency(text: string, preference: RoleModelHint['latencyPreference']): number {
  if (preference === 'patient') return /reason|thinking|opus|pro|r1/i.test(text) ? 12 : 0
  if (preference === 'fast') return /flash|mini|haiku|lite|spark|fast/i.test(text) ? 18 : 0
  return /flash|mini|haiku|lite/i.test(text) ? 6 : /reason|thinking/i.test(text) ? -4 : 4
}

function scoreCost(text: string, preference: RoleModelHint['costPreference']): number {
  if (preference === 'quality_first') return /opus|pro|reason|thinking|sonnet|grok|r1/i.test(text) ? 16 : 0
  if (preference === 'low') return /mini|lite|haiku|flash|distill|small/i.test(text) ? 18 : 0
  return /mini|lite|flash|distill/i.test(text) ? 8 : /opus|pro|reason|thinking/i.test(text) ? 5 : 3
}

export function recommendModelsForRole(
  roleId: string,
  hint: RoleModelHint,
  catalog: CatalogProvider[],
  options: { recent?: ModelRef[]; current?: ModelRef; manual?: ModelRef; limit?: number } = {}
): ModelRecommendation[] {
  const limit = options.limit ?? 6
  const all = catalog.flatMap(group => group.models.map(model => ({provider: group.id, model: model.id, name: model.name || model.id, groupName: group.name || group.id, source: 'catalog' as const})))
  const extras: Array<{provider:string;model:string;name:string;groupName:string;source:ModelRecommendation['source']}> = []
  if (options.manual?.provider && options.manual?.model) extras.push({provider: options.manual.provider, model: options.manual.model, name: '当前手动选择', groupName: '角色设置', source: 'manual'})
  for (const item of options.recent || []) if (item.provider && item.model) extras.push({provider: item.provider, model: item.model, name: '最近使用', groupName: '最近模型', source: 'recent'})
  if (options.current?.provider && options.current?.model) extras.push({provider: options.current.provider, model: options.current.model, name: '宿主当前默认', groupName: '宿主默认', source: 'host_default'})

  const unique = [...extras, ...all].filter((item, index, arr) => arr.findIndex(other => other.provider === item.provider && other.model === item.model) === index)
  return unique.map(item => {
    const text = modelText(item.provider, item.model, item.name, item.groupName)
    const caps = detectCapabilities(item.provider, item.model, item.name, item.groupName)
    const requiredMatches = hint.requiredCapabilities.filter(cap => caps.includes(cap))
    const preferredMatches = (hint.preferredCapabilities || []).filter(cap => caps.includes(cap))
    const sourceBoost = item.source === 'manual' ? 35 : item.source === 'recent' ? 16 : item.source === 'host_default' ? 8 : 0
    const score = requiredMatches.length * 32 + preferredMatches.length * 14 + scoreCost(text, hint.costPreference) + scoreLatency(text, hint.latencyPreference) + sourceBoost
    const reasons = [
      requiredMatches.length ? `命中必需能力：${requiredMatches.join(', ')}` : `未完全命中必需能力：${hint.requiredCapabilities.join(', ')}`,
      preferredMatches.length ? `命中偏好能力：${preferredMatches.join(', ')}` : '',
      item.source === 'manual' ? '用户当前手动设置优先' : item.source === 'recent' ? '最近使用模型优先' : item.source === 'host_default' ? '宿主默认模型兜底' : '来自 DSH 模型目录',
    ].filter(Boolean)
    return {...item, temperature: undefined, score, matchedCapabilities: caps, reasons}
  }).filter(item => item.score > 0 || item.source !== 'catalog')
    .sort((a, b) => b.score - a.score || a.provider.localeCompare(b.provider) || a.model.localeCompare(b.model))
    .slice(0, limit)
}

export function recommendModelsForRoles(
  hints: Record<string, RoleModelHint>,
  catalog: CatalogProvider[],
  options: { recent?: ModelRef[]; current?: ModelRef; manualByRole?: Record<string, ModelRef>; limit?: number } = {}
): Record<string, ModelRecommendation[]> {
  return Object.fromEntries(Object.entries(hints).map(([roleId, hint]) => [roleId, recommendModelsForRole(roleId, hint, catalog, {recent: options.recent, current: options.current, manual: options.manualByRole?.[roleId], limit: options.limit})]))
}
