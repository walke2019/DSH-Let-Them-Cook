import React, { useState, useMemo } from 'react'
import type { ToolCallRecord } from './group-chat-view-types.js'
import { tx, type GroupChatLocale } from './i18n.js'

interface Props {
  tool: ToolCallRecord
  locale?: GroupChatLocale
}

interface ToolDefinition {
  titleZh: string
  titleEn: string
  icon: (size?: number) => React.ReactElement
}

function IconBook({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
      <path d="M6 6h10" />
      <path d="M6 10h10" />
    </svg>
  )
}

function IconEdit({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconSave({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}

function IconSearch({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconTerminal({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  )
}

function IconGlobe({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function IconImage({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

function IconToolDefault({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  read: {
    titleZh: '读取',
    titleEn: 'Read',
    icon: size => <IconBook size={size} />,
  },
  edit: {
    titleZh: '编辑',
    titleEn: 'Edit',
    icon: size => <IconEdit size={size} />,
  },
  write: {
    titleZh: '写入',
    titleEn: 'Write',
    icon: size => <IconSave size={size} />,
  },
  grep: {
    titleZh: 'Grep',
    titleEn: 'Grep',
    icon: size => <IconSearch size={size} />,
  },
  glob: {
    titleZh: 'Glob',
    titleEn: 'Glob',
    icon: size => <IconSearch size={size} />,
  },
  bash: {
    titleZh: 'Bash',
    titleEn: 'Bash',
    icon: size => <IconTerminal size={size} />,
  },
  web_search: {
    titleZh: '网页搜索',
    titleEn: 'Search',
    icon: size => <IconGlobe size={size} />,
  },
  web_fetch: {
    titleZh: '网页获取',
    titleEn: 'Fetch',
    icon: size => <IconGlobe size={size} />,
  },
  modlens_read_image: {
    titleZh: '图像解析',
    titleEn: 'Image OCR',
    icon: size => <IconImage size={size} />,
  },
}

function resolveToolTarget(tool: ToolCallRecord): { target?: string; diffStat?: { add: number; del: number } } {
  let target = tool.readWritePath
  let diffStat: { add: number; del: number } | undefined

  if (target && target.includes('  +')) {
    const parts = target.split('  +')
    target = parts[0]
    const match = parts[1].match(/^(\d+)\s+-(\d+)$/)
    if (match) {
      diffStat = { add: Number(match[1]), del: Number(match[2]) }
    }
  }

  if ((!target || !diffStat) && tool.arguments) {
    try {
      const parsed = typeof tool.arguments === 'string' ? JSON.parse(tool.arguments) : tool.arguments
      if (parsed && typeof parsed === 'object') {
        if (!target) {
          if (tool.name === 'bash') {
            target = parsed.description || parsed.command
          } else if (tool.name === 'edit' || tool.name === 'read' || tool.name === 'write') {
            target = parsed.file_path || parsed.path
          } else if (tool.name === 'grep' || tool.name === 'glob') {
            target = parsed.pattern || parsed.query
          } else if (tool.name === 'web_search') {
            target = parsed.query || (Array.isArray(parsed.queries) ? parsed.queries[0] : undefined)
          } else if (tool.name === 'web_fetch') {
            target = parsed.url
          } else {
            target = parsed.file_path || parsed.path || parsed.description || parsed.command || parsed.dir || parsed.pattern || parsed.query
          }
        }
        if (tool.name === 'edit' && !diffStat) {
          const oldStr = typeof parsed.old_string === 'string' ? parsed.old_string : ''
          const newStr = typeof parsed.new_string === 'string' ? parsed.new_string : ''
          if (oldStr || newStr) {
            diffStat = {
              add: newStr ? newStr.split('\n').length : 0,
              del: oldStr ? oldStr.split('\n').length : 0,
            }
          }
        }
      }
    } catch {}
  }

  return { target: target ? String(target) : undefined, diffStat }
}

export function GroupChatToolRow({ tool, locale = 'zh-CN' }: Props) {
  const [open, setOpen] = useState(false)
  const def = TOOL_REGISTRY[tool.name] || {
    titleZh: '工具调用',
    titleEn: 'Tool call',
    icon: size => <IconToolDefault size={size} />,
  }
  const title = locale === 'en-US' ? def.titleEn : def.titleZh
  const { target, diffStat } = useMemo(() => resolveToolTarget(tool), [tool])
  const isRunning = tool.status === 'running' || tool.status === 'pending'
  const isError = tool.status === 'error'

  const durationText = useMemo(() => {
    if (!tool.durationMs) return undefined
    return tool.durationMs < 1000 ? `${tool.durationMs}ms` : `${(tool.durationMs / 1000).toFixed(1)}s`
  }, [tool.durationMs])

  return (
    <div
      className="gc-tool-row"
      data-status={tool.status}
      data-open={open ? 'true' : 'false'}
    >
      <div
        className="gc-tool-row-header"
        onClick={() => setOpen(v => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(v => !v)
          }
        }}
      >
        <span className="gc-tool-icon" aria-hidden="true">
          {def.icon(14)}
        </span>

        {isError && (
          <span className="gc-tool-tag-error" title={tx(locale, '执行失败', 'Execution failed')}>
            {tx(locale, '失败', 'Failed')}
          </span>
        )}

        <span className="gc-tool-title">{title}</span>

        {target && (
          <code className="gc-tool-target" title={target}>
            {target}
          </code>
        )}

        {diffStat && (
          <span className="gc-tool-diff" aria-label={`+${diffStat.add} -${diffStat.del}`}>
            <span className="gc-tool-diff-add">+{diffStat.add}</span>
            <span className="gc-tool-diff-del">-{diffStat.del}</span>
          </span>
        )}

        <div className="gc-tool-trailing">
          {isRunning && (
            <span className="gc-tool-status gc-tool-status-running">
              <span className="gc-tool-spin" aria-hidden="true" />
              {tx(locale, '运行中…', 'Running…')}
            </span>
          )}

          {!isRunning && !isError && durationText && (
            <span className="gc-tool-duration">{durationText}</span>
          )}

          <svg
            className={`gc-tool-chevron ${open ? 'gc-tool-chevron-open' : ''}`}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>

      {open && (
        <div className="gc-tool-row-body">
          {tool.arguments && (
            <div className="gc-tool-section">
              <div className="gc-tool-section-label">{tx(locale, '入参 (Input)', 'Input (Args)')}</div>
              <pre className="gc-tool-code">{tool.arguments}</pre>
            </div>
          )}

          {tool.result && (
            <div className="gc-tool-section">
              <div className="gc-tool-section-label">{tx(locale, '产物 / 结果 (Output)', 'Output (Result)')}</div>
              <pre className="gc-tool-code gc-tool-code-result">{tool.result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
