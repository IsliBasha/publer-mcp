'use client'
import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ComposeModal } from '@/components/dashboard/ComposeModal'
import { ChevronLeft, ChevronRight, Plus, CalendarX2, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ScheduledPost } from '@publer-mcp/shared-types'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const PLATFORM_CHIP: Record<string, string> = {
  linkedin: 'bg-platform-linkedin/15 text-platform-linkedin',
  instagram: 'bg-platform-instagram/15 text-platform-instagram',
  twitter: 'bg-platform-twitter/15 text-platform-twitter',
  facebook: 'bg-platform-facebook/15 text-platform-facebook',
}

function toCalendarItems(posts: ScheduledPost[]) {
  return posts.map((p) => ({
    id: p.id,
    day: new Date(p.scheduledAt).getDate(),
    platform: p.platforms[0] ?? 'linkedin',
    label: p.content.slice(0, 40),
  }))
}

export default function CalendarPage() {
  const [offset, setOffset]           = useState(0)
  const [posts, setPosts]             = useState<ScheduledPost[]>([])
  const [loading, setLoading]         = useState(true)
  const [composeOpen, setComposeOpen] = useState(false)
  const [defaultDate, setDefaultDate] = useState<string | undefined>()
  const [deleting, setDeleting]       = useState<Set<string>>(new Set())

  const now = new Date()
  const viewDate = new Date(now.getFullYear(), now.getMonth() + offset, 1)

  const firstDay = viewDate.getDay()
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const isCurrentMonth =
    viewDate.getMonth() === now.getMonth() && viewDate.getFullYear() === now.getFullYear()

  const fetchPosts = useCallback(() => {
    setLoading(true)
    const from = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).toISOString()
    const to   = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).toISOString()
    fetch(`/api/posts?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data: { posts?: ScheduledPost[] }) => {
        if (data.posts) setPosts(data.posts)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  // viewDate changes when offset changes; offset is the real dep
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  function openComposeForDay(day: number) {
    // Build a datetime-local string at noon for the clicked day
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, 12, 0)
    // datetime-local format: YYYY-MM-DDTHH:mm
    const pad = (n: number) => String(n).padStart(2, '0')
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    setDefaultDate(local)
    setComposeOpen(true)
  }

  function openComposeBlank() {
    setDefaultDate(undefined)
    setComposeOpen(true)
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (deleting.has(id)) return
    setDeleting((prev) => new Set(prev).add(id))
    try {
      await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      setPosts((prev) => prev.filter((p) => p.id !== id))
    } finally {
      setDeleting((prev) => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  const calendarItems = toCalendarItems(posts)

  return (
    <div className="flex h-screen overflow-hidden bg-surface-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-7 max-w-[1200px] mx-auto">

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-[22px] font-semibold text-ink-primary font-display mb-0.5">
                Content Calendar
              </h1>
              <p className="text-[13px] text-ink-secondary">
                {loading ? 'Loading…' : `${posts.length} posts scheduled this month`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setOffset((o) => o - 1)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-raised hover:text-ink-primary transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 text-[13px] font-medium text-ink-primary min-w-[148px] text-center">
                  {monthLabel}
                </span>
                <button
                  onClick={() => setOffset((o) => o + 1)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-raised hover:text-ink-primary transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={openComposeBlank}
                className="flex items-center gap-2 rounded-xl bg-coral hover:bg-coral-deep px-4 py-2 text-[13px] font-medium text-white transition-colors duration-150"
              >
                <Plus className="h-4 w-4" />
                Schedule Post
              </button>
            </div>
          </div>

          <div className={cn('rounded-xl border border-edge-default overflow-hidden relative', loading && 'opacity-60 pointer-events-none')}>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Loader2 className="h-5 w-5 text-ink-disabled animate-spin" />
              </div>
            )}
            <div className="grid grid-cols-7 border-b border-edge-default bg-surface-raised">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="py-3 text-center text-[10px] font-medium tracking-[0.08em] uppercase text-ink-disabled"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                const dayPosts = day ? calendarItems.filter((p) => p.day === day) : []
                const isToday = isCurrentMonth && day === now.getDate()

                return (
                  <div
                    key={i}
                    onClick={() => day && openComposeForDay(day)}
                    className={cn(
                      'min-h-[96px] border-b border-r border-edge-subtle/40 p-2',
                      'last:border-r-0 [&:nth-child(7n)]:border-r-0',
                      day
                        ? 'bg-surface-base hover:bg-surface-raised/30 cursor-pointer transition-colors'
                        : 'bg-surface-sidebar/30',
                    )}
                  >
                    {day && (
                      <>
                        <span
                          className={cn(
                            'inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-medium',
                            isToday ? 'bg-coral text-white' : 'text-ink-secondary'
                          )}
                        >
                          {day}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {dayPosts.map((post, j) => (
                            <div
                              key={j}
                              onClick={(e) => e.stopPropagation()}
                              className={cn(
                                'group relative flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
                                PLATFORM_CHIP[post.platform] ?? 'bg-surface-overlay text-ink-secondary'
                              )}
                            >
                              <span className="truncate pr-3 block w-full">
                                {deleting.has(post.id)
                                  ? <Loader2 className="h-2.5 w-2.5 animate-spin inline" />
                                  : post.label
                                }
                              </span>
                              <button
                                onClick={(e) => void handleDelete(post.id, e)}
                                disabled={deleting.has(post.id)}
                                aria-label="Delete post"
                                className="absolute right-0.5 top-1/2 -translate-y-1/2 hidden group-hover:flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/40 text-white hover:bg-status-error transition-colors disabled:opacity-40"
                              >
                                <X className="h-2 w-2" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {!loading && posts.length === 0 && (
            <div className="mt-4 rounded-xl border border-edge-default bg-surface-raised py-12 flex flex-col items-center gap-3">
              <CalendarX2 className="h-7 w-7 text-ink-disabled" />
              <div className="text-center">
                <p className="text-[13px] font-medium text-ink-secondary">Nothing scheduled this month</p>
                <p className="text-[12px] text-ink-disabled mt-0.5">Plan ahead and schedule your first post.</p>
              </div>
              <button
                onClick={openComposeBlank}
                className="mt-1 flex items-center gap-2 rounded-xl bg-coral hover:bg-coral-deep px-4 py-2 text-[13px] font-medium text-white transition-colors duration-150"
              >
                <Plus className="h-4 w-4" />
                Schedule Post
              </button>
            </div>
          )}

        </div>
      </main>

      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSuccess={fetchPosts}
        defaultDate={defaultDate}
      />
    </div>
  )
}
