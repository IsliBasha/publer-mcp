'use client'
import { useState } from 'react'
import { CheckCircle2, XCircle, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ToolCall } from '@/types/chat'

interface ToolCallCardProps {
  toolCall: ToolCall
  compact?: boolean
}

export function ToolCallCard({ toolCall, compact = false }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false)

  const isRunning = toolCall.status === 'running'
  const isDone = toolCall.status === 'done'
  const isError = toolCall.status === 'error'

  return (
    <div className={cn('rounded-lg border border-edge-default bg-surface-raised overflow-hidden animate-slide-up', compact && 'text-[11px]')}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-overlay/60 transition-colors duration-100"
        aria-expanded={expanded}
      >
        <code className="font-mono text-[12px] text-ink-primary font-medium flex-1 truncate">
          {toolCall.tool}
        </code>

        {isRunning && <Loader2 className="h-3 w-3 text-coral animate-spin shrink-0" />}
        {isDone && <CheckCircle2 className="h-3 w-3 text-status-success shrink-0" />}
        {isError && <XCircle className="h-3 w-3 text-status-error shrink-0" />}

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

      {expanded && (
        <div className="border-t border-edge-subtle px-3 py-2.5 space-y-3 animate-fade-in">
          <div>
            <p className="text-[10px] font-medium tracking-[0.06em] uppercase text-ink-disabled mb-1">
              Input
            </p>
            <pre className="font-mono text-[11px] text-ink-secondary overflow-x-auto leading-relaxed">
              {JSON.stringify(toolCall.params, null, 2)}
            </pre>
          </div>

          {toolCall.result !== undefined && (
            <div>
              <p className="text-[10px] font-medium tracking-[0.06em] uppercase text-ink-disabled mb-1">
                Output
              </p>
              <pre className="font-mono text-[11px] text-ink-secondary overflow-x-auto leading-relaxed max-h-40 overflow-y-auto">
                {JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          )}

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
