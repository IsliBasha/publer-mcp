'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, RotateCcw, Terminal } from 'lucide-react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ToolCallCard } from '@/components/ai/ToolCallCard'
import { SEED_MESSAGES, SEED_TOOL_CALLS, SEED_ACCOUNTS } from '@/lib/seed-data'
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

function pickTools(text: string): { tool: string; params: Record<string, unknown>; delay: number; result: unknown; duration: number } {
  const lower = text.toLowerCase()
  if (lower.includes('hashtag')) {
    return { tool: 'generate_hashtags', params: { platform: 'linkedin', topic: text.slice(0, 80) }, delay: 900, result: { hashtags: ['#ContentMarketing', '#SocialMedia', '#LinkedIn', '#AI', '#Publer'] }, duration: 743 }
  }
  if (lower.includes('caption') || lower.includes('generate') || lower.includes('write') || lower.includes('content')) {
    return { tool: 'generate_caption_ai', params: { platform: 'linkedin', topic: text.slice(0, 80), tone: 'professional' }, delay: 1400, result: { caption: 'Generated caption ready.', characterCount: 280, estimatedEngagementBoost: '18%' }, duration: 1624 }
  }
  if (lower.includes('analytic') || lower.includes('performance') || lower.includes('engagement')) {
    return { tool: 'get_post_analytics', params: { postId: 'recent' }, delay: 800, result: { likes: 142, comments: 31, shares: 19, impressions: 4820, engagementRate: 3.98 }, duration: 512 }
  }
  if (lower.includes('follower') || lower.includes('account')) {
    return { tool: 'get_followers', params: {}, delay: 700, result: { metrics: SEED_ACCOUNTS.map((a) => ({ ...a, followers: 1420 })), totalAccounts: 3 }, duration: 398 }
  }
  if (lower.includes('schedule') || lower.includes('when') || lower.includes('time')) {
    return { tool: 'get_best_posting_time', params: { platform: 'linkedin' }, delay: 600, result: { platform: 'linkedin', recommendations: [{ dayOfWeek: 'Tuesday', hour: 9, confidence: 0.91, expectedEngagementBoost: 22 }], reasoning: 'LinkedIn peaks Tuesday–Thursday, 8–10 AM.' }, duration: 487 }
  }
  return { tool: 'list_scheduled_posts', params: { limit: 5 }, delay: 700, result: { total: 2, posts: [] }, duration: 529 }
}

function buildResponse(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('hashtag')) return `Here are hashtags for your content:\n\n#ContentMarketing #SocialMedia #LinkedIn #AI #Publer\n\nThese 5 tags target your professional audience and align with current trending topics in social media management.`
  if (lower.includes('caption') || lower.includes('generate') || lower.includes('write')) return `Here is a LinkedIn caption ready to publish:\n\n---\nSocial media management just got a serious upgrade.\n\nWith Publer MCP, you can schedule posts, generate captions, and analyze performance — all through a conversation with Claude. No dashboards to juggle. No manual scheduling.\n\nThis is what AI-native tooling actually looks like.\n\n#AITools #SocialMedia #ProductLaunch\n---\n\nAt 280 characters this performs well algorithmically. Want me to schedule it for Tuesday at 9 AM when your LinkedIn engagement peaks?`
  if (lower.includes('analytic') || lower.includes('performance')) return `Here is a recent post performance snapshot:\n\n142 likes, 31 comments, 19 shares\n4,820 impressions — 3.98% engagement rate\n\nThis is above your account average of 2.4%. Posts mentioning product features are consistently your top performers. Want me to generate more content in that style?`
  if (lower.includes('follower')) return `Your follower counts look healthy across all 3 platforms. LinkedIn is your strongest channel by engagement rate. Want a detailed breakdown or a comparison against last month?`
  if (lower.includes('schedule') || lower.includes('when') || lower.includes('time')) return `For LinkedIn, Tuesday at 9:00 AM is your best window — 91% confidence, with a 22% expected engagement boost over off-peak posts. Thursday 5 PM is a strong second choice. Want me to schedule your next post for Tuesday?`
  return `Done. I checked your Publer queue. You have posts scheduled across this week. Want me to show the full schedule or help you create something new?`
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES)
  const [toolHistory, setToolHistory] = useState<ToolCall[]>(SEED_TOOL_CALLS)
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const timersRef = useRef<NodeJS.Timeout[]>([])

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

  useEffect(() => () => { timersRef.current.forEach(clearTimeout) }, [])

  const send = useCallback(() => {
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

    const toolDef = pickTools(text)
    const assistantId = `a-${Date.now()}`

    const t1 = setTimeout(() => {
      const runningCall: ToolCall = {
        id: `tc-${Date.now()}`,
        tool: toolDef.tool,
        params: toolDef.params,
        status: 'running',
        startedAt: new Date(),
      }

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', toolCalls: [runningCall], timestamp: new Date() },
      ])
      setToolHistory((prev) => [...prev, runningCall])

      const t2 = setTimeout(() => {
        const doneCall: ToolCall = { ...runningCall, status: 'done', result: toolDef.result, duration: toolDef.duration }

        setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, toolCalls: [doneCall] } : m))
        setToolHistory((prev) => prev.map((tc) => tc.id === runningCall.id ? doneCall : tc))

        const t3 = setTimeout(() => {
          setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: buildResponse(text) } : m))
          setIsGenerating(false)
        }, 350)

        timersRef.current.push(t3)
      }, toolDef.delay)

      timersRef.current.push(t2)
    }, 420)

    timersRef.current.push(t1)
  }, [input, isGenerating])

  const reset = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setMessages(SEED_MESSAGES)
    setToolHistory(SEED_TOOL_CALLS)
    setIsGenerating(false)
    setInput('')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-base">
      <Sidebar />

      <main className="flex-1 flex overflow-hidden min-w-0">
        {/* Conversation zone — 68% */}
        <section className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Account strip */}
          <header className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-edge-subtle">
            <span className="text-[10px] font-medium tracking-widest uppercase text-ink-disabled">Connected</span>
            <div className="flex items-center gap-1.5">
              {SEED_ACCOUNTS.map((acc) => (
                <span
                  key={acc.id}
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                    PLATFORM_COLORS[acc.platform] ?? 'bg-surface-overlay text-ink-secondary'
                  )}
                >
                  {acc.handle}
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
                <div className="h-1.5 w-1.5 rounded-full bg-ink-disabled" />
                <span className="text-[11px] text-ink-secondary">Claude ready</span>
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
                <div className="h-2 w-2 rounded-full bg-coral animate-pulse-dot" />
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
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
                }}
                disabled={isGenerating}
                placeholder="Ask Claude anything about your Publer workspace… (Cmd+K)"
                rows={1}
                className={cn(
                  'flex-1 resize-none rounded-xl bg-surface-raised border border-edge-default',
                  'px-4 py-3 text-[14px] text-ink-primary placeholder:text-ink-disabled',
                  'focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 focus:ring-offset-0',
                  'transition-[border-color,box-shadow] duration-150',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                style={{ minHeight: '46px' }}
              />
              <button
                onClick={send}
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
              Shift+Enter for new line. Claude has access to 13 Publer MCP tools.
            </p>
          </div>
        </section>

        {/* Tool rail — 32% */}
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
