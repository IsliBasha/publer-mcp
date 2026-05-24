'use client'
import { useState } from 'react'
import { X, Loader2, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin',  label: 'LinkedIn'  },
  { id: 'twitter',   label: 'Twitter/X' },
  { id: 'facebook',  label: 'Facebook'  },
  { id: 'tiktok',    label: 'TikTok'    },
]

const PLATFORM_CHIP: Record<string, string> = {
  instagram: 'border-platform-instagram text-platform-instagram',
  linkedin:  'border-platform-linkedin text-platform-linkedin',
  twitter:   'border-platform-twitter text-platform-twitter',
  facebook:  'border-platform-facebook text-platform-facebook',
  tiktok:    'border-platform-tiktok text-platform-tiktok',
}

export interface ComposeModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  /** Pre-fill scheduled date, e.g. when clicking a calendar cell */
  defaultDate?: string
}

export function ComposeModal({ open, onClose, onSuccess, defaultDate }: ComposeModalProps) {
  const [content, setContent]         = useState('')
  const [platforms, setPlatforms]     = useState<string[]>([])
  const [scheduledAt, setScheduledAt] = useState(defaultDate ?? '')
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState<string | null>(null)

  if (!open) return null

  function reset() {
    setContent('')
    setPlatforms([])
    setScheduledAt(defaultDate ?? '')
    setError(null)
  }

  function togglePlatform(id: string) {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  // Client-side validation mirrors server Zod schema for fast feedback
  function validate(): string | null {
    if (!content.trim()) return 'Content is required'
    if (platforms.length === 0) return 'Select at least one platform'
    if (!scheduledAt) return 'Scheduled time is required'
    return null
  }

  async function handleSubmit() {
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          platforms,
          scheduledAt: new Date(scheduledAt).toISOString(),
        }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed to schedule post')
        return
      }

      reset()
      onSuccess()
      onClose()
    } catch {
      setError('Network error — could not reach the server')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Schedule Post"
    >
      <div className="w-full max-w-[520px] rounded-2xl border border-edge-default bg-surface-raised shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge-subtle">
          <h2 className="text-[15px] font-semibold text-ink-primary">Schedule Post</h2>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-ink-disabled hover:text-ink-secondary hover:bg-surface-overlay transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Content */}
          <div>
            <label htmlFor="compose-content" className="block text-[11px] font-medium tracking-[0.06em] uppercase text-ink-disabled mb-2">
              Content
            </label>
            <textarea
              id="compose-content"
              aria-label="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Write your post…"
              className={cn(
                'w-full rounded-xl bg-surface-base border border-edge-default resize-none',
                'px-4 py-3 text-[14px] text-ink-primary placeholder:text-ink-disabled',
                'focus:outline-none focus:border-edge-default focus:ring-2 focus:ring-edge-default/20',
                'transition-[border-color,box-shadow] duration-150'
              )}
            />
            <p className="mt-1 text-[11px] text-ink-disabled text-right tabular-nums">
              {content.length}/5000
            </p>
          </div>

          {/* Platforms */}
          <div>
            <p className="text-[11px] font-medium tracking-[0.06em] uppercase text-ink-disabled mb-2">
              Platforms
            </p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(({ id, label }) => (
                <label key={id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id={`platform-${id}`}
                    name={id}
                    aria-label={label}
                    checked={platforms.includes(id)}
                    onChange={() => togglePlatform(id)}
                    className="sr-only"
                  />
                  <span
                    onClick={() => togglePlatform(id)}
                    className={cn(
                      'inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-medium transition-all duration-100 select-none cursor-pointer',
                      platforms.includes(id)
                        ? cn('border-2', PLATFORM_CHIP[id] ?? 'border-ink-secondary text-ink-secondary')
                        : 'border border-edge-default text-ink-disabled hover:border-edge-default/60'
                    )}
                  >
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Scheduled time */}
          <div>
            <label htmlFor="compose-scheduled-at" className="block text-[11px] font-medium tracking-[0.06em] uppercase text-ink-disabled mb-2">
              Schedule for
            </label>
            <input
              id="compose-scheduled-at"
              aria-label="Schedule for"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className={cn(
                'w-full rounded-xl bg-surface-base border border-edge-default',
                'px-4 py-2.5 text-[14px] text-ink-primary',
                'focus:outline-none focus:border-edge-default focus:ring-2 focus:ring-edge-default/20',
                'transition-[border-color,box-shadow] duration-150'
              )}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[13px] text-status-error">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-edge-subtle">
          <button
            aria-label="Cancel"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[13px] font-medium text-ink-secondary hover:text-ink-primary hover:bg-surface-overlay transition-colors duration-100"
          >
            Cancel
          </button>
          <button
            aria-label={submitting ? 'Scheduling…' : 'Schedule Post'}
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className={cn(
              'flex items-center gap-2 rounded-xl px-5 py-2 text-[13px] font-medium text-white',
              'bg-coral hover:bg-coral-deep disabled:opacity-40 disabled:cursor-not-allowed',
              'transition-colors duration-150'
            )}
          >
            {submitting
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Scheduling…</>
              : <><Send className="h-3.5 w-3.5" /> Schedule Post</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
