'use client'
import { useState } from 'react'
import { CheckCircle2, XCircle, ChevronDown, Loader2, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ToolCall } from '@/types/chat'

interface ToolCallCardProps {
  toolCall: ToolCall
  compact?: boolean
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Renders params as a readable two-column table instead of raw JSON. */
function ParamTable({ params }: { params: Record<string, unknown> }) {
  if (Object.keys(params).length === 0) {
    return <span className="font-mono text-[11px] text-ink-disabled">—</span>
  }
  return (
    <table className="w-full text-[11px] border-separate border-spacing-0">
      <tbody>
        {Object.entries(params).map(([key, value]) => (
          <tr key={key} className="align-top">
            <td className="pr-3 py-0.5 font-mono text-ink-disabled whitespace-nowrap w-0">{key}</td>
            <td className="py-0.5 font-mono text-ink-secondary break-all">
              {typeof value === 'string' ? value : JSON.stringify(value)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Copy-to-clipboard button with visual feedback. */
function CopyButton({ value }: { value: unknown }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(JSON.stringify(value, null, 2)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy result"
      className="inline-flex items-center gap-1 text-[10px] text-ink-disabled hover:text-ink-secondary transition-colors duration-100"
    >
      {copied
        ? <Check className="h-3 w-3 text-status-success" />
        : <Copy className="h-3 w-3" />
      }
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

/** Returns the first meaningful string param value for the header summary. */
function getParamSummary(params: Record<string, unknown>): string | null {
  const priority = ['platform', 'content', 'accountId', 'postId', 'query', 'brand', 'platforms']
  for (const key of priority) {
    const val = params[key]
    if (typeof val === 'string' && val.length > 0) {
      return val.length > 22 ? `${val.slice(0, 22)}…` : val
    }
  }
  const first = Object.values(params)[0]
  if (typeof first === 'string' && first.length > 0) {
    return first.length > 22 ? `${first.slice(0, 22)}…` : first
  }
  return null
}

// ── Main component ────────────────────────────────────────────────────────────

export function ToolCallCard({ toolCall, compact = false }: ToolCallCardProps) {
  // Auto-expand running calls so the user can see what params are being sent
  const [expanded, setExpanded] = useState(toolCall.status === 'running')

  const isRunning = toolCall.status === 'running'
  const isDone = toolCall.status === 'done'
  const isError = toolCall.status === 'error'

  const paramSummary = compact ? null : getParamSummary(toolCall.params)

  return (
    <div
      className={cn(
        'rounded-lg border border-edge-default bg-surface-raised overflow-hidden animate-slide-up',
        compact && 'text-[11px]'
      )}
    >
      {/* ── Header / trigger ─────────────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-overlay/60 transition-colors duration-100"
        aria-expanded={expanded}
        aria-label={toolCall.tool}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <code className="font-mono text-[12px] text-ink-secondary truncate">
            {toolCall.tool}
          </code>
          {!compact && paramSummary && (
            <span className="text-[11px] text-ink-disabled shrink-0 truncate max-w-[110px]">
              · {paramSummary}
            </span>
          )}
        </div>

        {isRunning && <Loader2 className="h-3 w-3 text-ink-disabled animate-spin shrink-0" />}
        {isDone   && <CheckCircle2 className="h-3 w-3 text-status-success shrink-0" />}
        {isError  && <XCircle className="h-3 w-3 text-status-error shrink-0" />}

        {toolCall.duration !== undefined && (
          <span className="font-mono text-[11px] text-ink-disabled shrink-0 tabular-nums">
            {toolCall.duration}ms
          </span>
        )}

        <ChevronDown
          className={cn(
            'h-3 w-3 text-ink-disabled shrink-0 transition-transform duration-150',
            expanded && 'rotate-180'
          )}
        />
      </button>

      {/* ── Expanded detail ───────────────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-edge-subtle px-3 py-2.5 space-y-3 animate-fade-in">
          {/* Params as KV table */}
          <div>
            <p className="text-[10px] font-medium tracking-[0.06em] uppercase text-ink-disabled mb-1.5">
              Input
            </p>
            <ParamTable params={toolCall.params} />
          </div>

          {/* Result with copy button */}
          {toolCall.result !== undefined && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-[10px] font-medium tracking-[0.06em] uppercase text-ink-disabled">
                  Output
                </p>
                <CopyButton value={toolCall.result} />
              </div>
              <pre className="font-mono text-[11px] text-ink-secondary overflow-x-auto leading-relaxed max-h-40 overflow-y-auto">
                {JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          )}

          {/* Error message */}
          {toolCall.errorMessage && (
            <div>
              <p className="text-[10px] font-medium tracking-[0.06em] uppercase text-status-error mb-1">
                Error
              </p>
              <pre className="font-mono text-[11px] text-status-error/80 leading-relaxed">
                {toolCall.errorMessage}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
