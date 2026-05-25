'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, RotateCcw, Terminal } from 'lucide-react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ToolCallCard } from '@/components/ai/ToolCallCard'
import { useAccounts } from '@/hooks/useAccounts'
import { cn } from '@/lib/utils'
import type { Message, ToolCall } from '@/types/chat'

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: 'bg-platform-linkedin/15 text-platform-linkedin',
  instagram: 'bg-platform-instagram/15 text-platform-instagram',
  twitter: 'bg-platform-twitter/15 text-platform-twitter',
  tiktok: 'bg-platform-tiktok/15 text-platform-tiktok',
  facebook: 'bg-platform-facebook/15 text-platform-facebook',
}

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [toolHistory, setToolHistory] = useState<ToolCall[]>([])
  const accounts = useAccounts()
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sessionHistoryRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [messages, isGenerating])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => () => { abortRef.current?.abort() }, [])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || isGenerating) return

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setIsGenerating(true)

    const assistantId = `a-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', toolCalls: [], timestamp: new Date() },
    ])

    sessionHistoryRef.current.push({ role: 'user', content: text })

    const controller = new AbortController()
    abortRef.current = controller
    let fullText = ''

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: sessionHistoryRef.current }),
        signal: controller.signal,
      })

      if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`)

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const event = JSON.parse(line) as Record<string, unknown>

            if (event.type === 'text') {
              const delta = event.delta as string
              fullText += delta
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + delta } : m
                )
              )
            } else if (event.type === 'tool_start') {
              const tc: ToolCall = {
                id: event.id as string,
                tool: event.tool as string,
                params: event.params as Record<string, unknown>,
                status: 'running',
                startedAt: new Date(),
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, toolCalls: [...(m.toolCalls ?? []), tc] }
                    : m
                )
              )
              setToolHistory((prev) => [...prev, tc])
            } else if (event.type === 'tool_done') {
              const id = event.id as string
              const hasError = !!(event.result as Record<string, unknown>)?.error
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? {
                        ...m,
                        toolCalls: (m.toolCalls ?? []).map((tc) =>
                          tc.id === id
                            ? {
                                ...tc,
                                status: hasError ? ('error' as const) : ('done' as const),
                                result: event.result,
                                duration: event.duration as number,
                              }
                            : tc
                        ),
                      }
                    : m
                )
              )
              setToolHistory((prev) =>
                prev.map((tc) =>
                  tc.id === id
                    ? {
                        ...tc,
                        status: hasError ? ('error' as const) : ('done' as const),
                        result: event.result,
                        duration: event.duration as number,
                      }
                    : tc
                )
              )
            } else if (event.type === 'done') {
              sessionHistoryRef.current.push({ role: 'assistant', content: fullText })
              setIsGenerating(false)
            } else if (event.type === 'error') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: `Error: ${event.message as string}` }
                    : m
                )
              )
              setIsGenerating(false)
            }
          } catch {
            // skip malformed line
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      const message = err instanceof Error ? err.message : 'Unknown error'
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: `Error: ${message}` } : m
        )
      )
      setIsGenerating(false)
    }
  }, [input, isGenerating])

  const reset = () => {
    abortRef.current?.abort()
    abortRef.current = null
    sessionHistoryRef.current = []
    setMessages([])
    setToolHistory([])
    setIsGenerating(false)
    setInput('')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-base">
      <Sidebar />

      <main className="flex-1 flex overflow-hidden min-w-0">
        {/* Conversation zone */}
        <section className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Account strip */}
          <header className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-edge-subtle">
            <span className="text-[10px] font-medium tracking-widest uppercase text-ink-disabled">Connected</span>
            <div className="flex items-center gap-1.5">
              {accounts.map((acc) => (
                <span
                  key={acc.id}
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                    PLATFORM_COLORS[acc.platform] ?? 'bg-surface-overlay text-ink-secondary'
                  )}
                >
                  {acc.username}
                </span>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-5">
              <button
                onClick={reset}
                className="flex items-center gap-1.5 text-[12px] text-ink-secondary hover:text-ink-primary transition-colors duration-100"
                title="New conversation"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                New chat
              </button>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-status-success" />
                <span className="text-[11px] text-ink-secondary">Claude connected</span>
              </div>
            </div>
          </header>

          {/* Message feed */}
          <div ref={feedRef} className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex flex-col gap-2 animate-slide-up',
                  msg.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="w-full max-w-[520px] space-y-1.5">
                    {msg.toolCalls.map((tc) => (
                      <ToolCallCard key={tc.id} toolCall={tc} />
                    ))}
                  </div>
                )}

                {msg.content && (
                  <div className={cn(
                    'max-w-[600px]',
                    msg.role === 'user' && 'bg-surface-overlay rounded-2xl rounded-tr-sm px-4 py-3'
                  )}>
                    <p className={cn(
                      'text-[14px] leading-[1.65] whitespace-pre-wrap break-words',
                      msg.role === 'user' ? 'text-ink-primary' : 'text-ink-secondary'
                    )}>
                      {msg.content}
                    </p>
                  </div>
                )}

                <time className="text-[11px] text-ink-disabled px-0.5">
                  {formatRelative(msg.timestamp)}
                </time>
              </div>
            ))}

            {isGenerating && (
              <div className="flex items-center gap-2.5 animate-fade-in">
                <div className="h-2 w-2 rounded-full bg-ink-disabled animate-pulse-dot" />
                <span className="text-[12px] text-ink-disabled">Claude is responding</span>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-edge-subtle px-6 py-4">
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() }
                }}
                disabled={isGenerating}
                placeholder="Ask Claude anything about your Publer workspace… (Cmd+K)"
                rows={1}
                className={cn(
                  'flex-1 resize-none rounded-xl bg-surface-raised border border-edge-default',
                  'px-4 py-3 text-[14px] text-ink-primary placeholder:text-ink-disabled',
                  'focus:outline-none focus:border-edge-default focus:ring-2 focus:ring-edge-default/20 focus:ring-offset-0',
                  'transition-[border-color,box-shadow] duration-150',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                style={{ minHeight: '46px' }}
              />
              <button
                onClick={() => void send()}
                disabled={!input.trim() || isGenerating}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] font-medium text-white shrink-0',
                  'bg-coral hover:bg-coral-deep',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'transition-colors duration-150'
                )}
              >
                <Send className="h-4 w-4" />
                <span>Send</span>
              </button>
            </div>
            <p className="mt-2 text-[11px] text-ink-disabled">
              Shift+Enter for new line. Claude has access to 10 Publer tools.
            </p>
          </div>
        </section>

        {/* Tool rail */}
        <aside className="hidden lg:flex w-[272px] shrink-0 flex-col border-l border-edge-subtle overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-edge-subtle shrink-0">
            <Terminal className="h-3.5 w-3.5 text-ink-secondary shrink-0" />
            <span className="text-[12px] font-medium text-ink-secondary">Tool Activity</span>
            <span className="ml-auto font-mono text-[11px] text-ink-disabled tabular-nums">
              {toolHistory.length} calls
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {toolHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Terminal className="h-5 w-5 text-ink-disabled mb-2" />
                <p className="text-[12px] text-ink-disabled">Tool calls will appear here</p>
              </div>
            ) : (
              [...toolHistory].reverse().map((tc) => (
                <div key={tc.id} className="space-y-1">
                  <ToolCallCard toolCall={tc} compact />
                  <p className="px-0.5 text-[10px] text-ink-disabled">{formatRelative(tc.startedAt)}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}
