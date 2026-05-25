'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'
import {
  Sparkles, Hash, Upload, X, Loader2, Send, Image as ImageIcon,
  AlertCircle, CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Constants ──────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'linkedin',  label: 'LinkedIn'  },
  { id: 'twitter',   label: 'Twitter/X' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook',  label: 'Facebook'  },
  { id: 'tiktok',    label: 'TikTok'    },
] as const

const PLATFORM_CHIP: Record<string, string> = {
  instagram: 'border-platform-instagram text-platform-instagram bg-platform-instagram/5',
  linkedin:  'border-platform-linkedin  text-platform-linkedin  bg-platform-linkedin/5',
  twitter:   'border-platform-twitter   text-platform-twitter   bg-platform-twitter/5',
  facebook:  'border-platform-facebook  text-platform-facebook  bg-platform-facebook/5',
  tiktok:    'border-platform-tiktok    text-platform-tiktok    bg-platform-tiktok/5',
}

const CHAR_LIMITS: Record<string, number> = {
  twitter: 280, linkedin: 3000, instagram: 2200,
  facebook: 63206, tiktok: 2200,
}

function charLimit(platforms: string[]): number {
  if (platforms.length === 0) return 3000
  return Math.min(...platforms.map((p) => CHAR_LIMITS[p] ?? 3000))
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface MediaFile {
  url: string              // local object URL for preview
  uploadedUrl: string | null  // server URL once uploaded
  name: string
  type: string
  uploading: boolean
  error: string | null
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ComposePage() {
  const router = useRouter()

  const [topic, setTopic]             = useState('')
  const [body, setBody]               = useState('')
  const [hashtags, setHashtags]       = useState('')
  const [platforms, setPlatforms]     = useState<string[]>(['linkedin'])
  const [scheduledAt, setScheduledAt] = useState('')
  const [media, setMedia]             = useState<MediaFile[]>([])
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted]     = useState(false)

  const [generatingBody, setGeneratingBody]         = useState(false)
  const [generatingHashtags, setGeneratingHashtags] = useState(false)
  const [bodyGenError, setBodyGenError]             = useState<string | null>(null)
  const [hashtagGenError, setHashtagGenError]       = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef      = useRef<HTMLDivElement>(null)
  const bodyRef      = useRef<HTMLTextAreaElement>(null)
  const abortRef     = useRef<AbortController | null>(null)

  const limit  = charLimit(platforms)
  const bodyLen = body.length

  // ── Platform toggle ──────────────────────────────────────────────────────
  function togglePlatform(id: string) {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  // ── AI: Generate body ────────────────────────────────────────────────────
  async function handleGenerateBody() {
    const t = topic.trim()
    if (!t) { setBodyGenError('Enter a topic first'); return }
    if (platforms.length === 0) { setBodyGenError('Select at least one platform'); return }

    setBodyGenError(null)
    setGeneratingBody(true)
    setBody('')
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'body', topic: t, platforms }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setBodyGenError(data.error ?? 'Generation failed')
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setBody((prev) => prev + chunk)
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setBodyGenError('Generation failed — check your connection')
      }
    } finally {
      setGeneratingBody(false)
    }
  }

  // ── AI: Generate hashtags ────────────────────────────────────────────────
  async function handleGenerateHashtags() {
    // Use body content if available, otherwise fall back to topic description
    const source = body.trim() || topic.trim()
    if (!source) { setHashtagGenError('Enter a topic or generate body text first'); return }
    if (platforms.length === 0) { setHashtagGenError('Select at least one platform'); return }

    setHashtagGenError(null)
    setGeneratingHashtags(true)

    try {
      const res = await fetch('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'hashtags', topic: source, platforms }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setHashtagGenError(data.error ?? 'Generation failed')
        return
      }

      const data = await res.json() as { hashtags?: string }
      if (data.hashtags) setHashtags(data.hashtags)
    } catch {
      setHashtagGenError('Generation failed — check your connection')
    } finally {
      setGeneratingHashtags(false)
    }
  }

  // ── Media upload ─────────────────────────────────────────────────────────
  const uploadFile = useCallback(async (file: File, index: number) => {
    const formData = new FormData()
    formData.append('files', file)

    try {
      const res  = await fetch('/api/uploads', { method: 'POST', body: formData })
      const data = await res.json() as { urls?: string[]; error?: string }

      setMedia((prev) =>
        prev.map((m, i) =>
          i === index
            ? { ...m, uploading: false, uploadedUrl: data.urls?.[0] ?? null, error: res.ok ? null : (data.error ?? 'Upload failed') }
            : m
        )
      )
    } catch {
      setMedia((prev) =>
        prev.map((m, i) => i === index ? { ...m, uploading: false, error: 'Upload failed' } : m)
      )
    }
  }, [])

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files).slice(0, 10 - media.length)
    if (arr.length === 0) return

    const startIndex = media.length
    const newItems: MediaFile[] = arr.map((f) => ({
      url: URL.createObjectURL(f),
      uploadedUrl: null,
      name: f.name,
      type: f.type,
      uploading: true,
      error: null,
    }))

    setMedia((prev) => [...prev, ...newItems])
    arr.forEach((file, i) => void uploadFile(file, startIndex + i))
  }

  function removeMedia(index: number) {
    setMedia((prev) => {
      URL.revokeObjectURL(prev[index]!.url)
      return prev.filter((_, i) => i !== index)
    })
  }

  // Drag-and-drop wiring
  useEffect(() => {
    const el = dropRef.current
    if (!el) return
    const prevent = (e: DragEvent) => e.preventDefault()
    const onDrop  = (e: DragEvent) => { e.preventDefault(); if (e.dataTransfer?.files) addFiles(e.dataTransfer.files) }
    el.addEventListener('dragover', prevent)
    el.addEventListener('drop', onDrop)
    return () => { el.removeEventListener('dragover', prevent); el.removeEventListener('drop', onDrop) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.length])

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!body.trim())        { setSubmitError('Post content is required'); return }
    if (!platforms.length)   { setSubmitError('Select at least one platform'); return }
    if (!scheduledAt)        { setSubmitError('Select a scheduled time'); return }
    if (media.some((m) => m.uploading)) { setSubmitError('Wait for media uploads to finish'); return }

    setSubmitError(null)
    setSubmitting(true)

    const fullContent = hashtags.trim()
      ? `${body.trim()}\n\n${hashtags.trim()}`
      : body.trim()

    const mediaUrls = media.filter((m) => m.uploadedUrl).map((m) => m.uploadedUrl!)

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: fullContent,
          platforms,
          scheduledAt: new Date(scheduledAt).toISOString(),
          ...(mediaUrls.length > 0 ? { mediaUrls } : {}),
        }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setSubmitError(data.error ?? 'Failed to schedule post')
        return
      }

      setSubmitted(true)
    } catch {
      setSubmitError('Network error — could not reach the server')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex h-screen overflow-hidden bg-surface-base">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-status-success/10 mx-auto mb-4">
              <CheckCircle2 className="h-7 w-7 text-status-success" />
            </div>
            <h2 className="text-[18px] font-semibold text-ink-primary font-display mb-1">Post scheduled</h2>
            <p className="text-[13px] text-ink-secondary mb-6">
              Added to the queue — it will publish at the scheduled time.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setBody(''); setTopic(''); setHashtags('')
                  setScheduledAt(''); setMedia([]); setPlatforms(['linkedin'])
                  setSubmitted(false)
                }}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-ink-secondary border border-edge-default hover:bg-surface-raised transition-colors"
              >
                New post
              </button>
              <button
                onClick={() => router.push('/calendar')}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-white bg-coral hover:bg-coral-deep transition-colors"
              >
                View calendar
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-surface-base">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-7 max-w-[760px] mx-auto">

          {/* Page header */}
          <div className="mb-7">
            <h1 className="text-[22px] font-semibold text-ink-primary font-display mb-0.5">New Post</h1>
            <p className="text-[13px] text-ink-secondary">
              Write manually or use AI to generate the body and hashtags separately.
            </p>
          </div>

          <div className="space-y-6">

            {/* Topic */}
            <div>
              <label htmlFor="compose-topic" className="block text-[11px] font-medium tracking-[0.06em] uppercase text-ink-disabled mb-2">
                Topic
                <span className="ml-1.5 normal-case tracking-normal font-normal text-ink-disabled/70">
                  — used as context by the AI generators below
                </span>
              </label>
              <input
                id="compose-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder='e.g. "Announcing our new MCP integration for social media"'
                className={cn(
                  'w-full rounded-xl bg-surface-base border border-edge-default',
                  'px-4 py-2.5 text-[14px] text-ink-primary placeholder:text-ink-disabled',
                  'focus:outline-none focus:ring-2 focus:ring-edge-default/30 transition-shadow'
                )}
              />
            </div>

            {/* Platforms */}
            <div>
              <p className="text-[11px] font-medium tracking-[0.06em] uppercase text-ink-disabled mb-2">Platforms</p>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => togglePlatform(id)}
                    className={cn(
                      'inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-medium transition-all duration-100 select-none',
                      platforms.includes(id)
                        ? cn('border-2', PLATFORM_CHIP[id] ?? 'border-ink-secondary text-ink-secondary')
                        : 'border border-edge-default text-ink-disabled hover:text-ink-secondary hover:border-edge-default/70'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Post Body */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-medium tracking-[0.06em] uppercase text-ink-disabled">Post Content</p>
                <button
                  type="button"
                  onClick={() => void handleGenerateBody()}
                  disabled={generatingBody}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border border-edge-default bg-surface-raised',
                    'px-3 py-1.5 text-[12px] font-medium text-ink-secondary',
                    'hover:text-ink-primary hover:border-coral/30 hover:bg-surface-overlay transition-all duration-100',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {generatingBody
                    ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating…</>
                    : <><Sparkles className="h-3 w-3" /> Generate body</>
                  }
                </button>
              </div>
              {bodyGenError && <ErrorNote message={bodyGenError} onDismiss={() => setBodyGenError(null)} />}
              <textarea
                ref={bodyRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={7}
                maxLength={limit}
                placeholder="Write your post here, or click Generate body to draft it with AI…"
                className={cn(
                  'w-full rounded-xl bg-surface-base border border-edge-default resize-none',
                  'px-4 py-3 text-[14px] text-ink-primary placeholder:text-ink-disabled',
                  'focus:outline-none focus:ring-2 focus:ring-edge-default/30 transition-shadow',
                  bodyLen > limit * 0.9 && 'border-status-warning/50'
                )}
              />
              <div className="flex justify-end mt-1">
                <span className={cn(
                  'text-[11px] tabular-nums',
                  bodyLen > limit * 0.9 ? 'text-status-warning' : 'text-ink-disabled'
                )}>
                  {bodyLen.toLocaleString()} / {limit.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Hashtags */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-medium tracking-[0.06em] uppercase text-ink-disabled">Hashtags</p>
                <button
                  type="button"
                  onClick={() => void handleGenerateHashtags()}
                  disabled={generatingHashtags}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border border-edge-default bg-surface-raised',
                    'px-3 py-1.5 text-[12px] font-medium text-ink-secondary',
                    'hover:text-ink-primary hover:border-coral/30 hover:bg-surface-overlay transition-all duration-100',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {generatingHashtags
                    ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating…</>
                    : <><Hash className="h-3 w-3" /> Generate hashtags</>
                  }
                </button>
              </div>
              {hashtagGenError && <ErrorNote message={hashtagGenError} onDismiss={() => setHashtagGenError(null)} />}
              <textarea
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                rows={2}
                placeholder="#saas #productlaunch — or click Generate hashtags"
                className={cn(
                  'w-full rounded-xl bg-surface-base border border-edge-default resize-none',
                  'px-4 py-3 text-[14px] text-ink-primary placeholder:text-ink-disabled',
                  'focus:outline-none focus:ring-2 focus:ring-edge-default/30 transition-shadow'
                )}
              />
              <p className="mt-1 text-[11px] text-ink-disabled">
                Hashtags are appended to the post content at schedule time.
              </p>
            </div>

            {/* Media upload */}
            <div>
              <p className="text-[11px] font-medium tracking-[0.06em] uppercase text-ink-disabled mb-2">Media</p>

              <div
                ref={dropRef}
                onClick={() => media.length < 10 && fileInputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center justify-center gap-2.5 rounded-xl',
                  'border-2 border-dashed border-edge-default bg-surface-raised py-8',
                  'cursor-pointer transition-colors',
                  media.length < 10
                    ? 'hover:border-edge-default/70 hover:bg-surface-overlay/20'
                    : 'pointer-events-none opacity-40'
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-overlay">
                  <Upload className="h-5 w-5 text-ink-disabled" />
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-medium text-ink-secondary">
                    Drop images or video here, or click to browse
                  </p>
                  <p className="text-[11px] text-ink-disabled mt-0.5">
                    JPG, PNG, GIF, WebP, MP4, MOV — max 10 MB each
                    {media.length > 0 && ` · ${10 - media.length} remaining`}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
                  className="sr-only"
                  onChange={(e) => { if (e.target.files) addFiles(e.target.files) }}
                />
              </div>

              {media.length > 0 && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {media.map((m, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-lg overflow-hidden bg-surface-overlay border border-edge-subtle"
                    >
                      {m.type.startsWith('video/') ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                          <ImageIcon className="h-5 w-5 text-ink-disabled" />
                          <span className="text-[9px] font-mono text-ink-disabled uppercase">Video</span>
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt={m.name} className="h-full w-full object-cover" />
                      )}

                      {m.uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                          <Loader2 className="h-4 w-4 text-white animate-spin" />
                        </div>
                      )}
                      {m.error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-status-error/20 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-status-error" />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeMedia(i) }}
                        aria-label="Remove file"
                        className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-status-error transition-colors"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Schedule */}
            <div>
              <label htmlFor="compose-schedule" className="block text-[11px] font-medium tracking-[0.06em] uppercase text-ink-disabled mb-2">
                Schedule for
              </label>
              <input
                id="compose-schedule"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className={cn(
                  'rounded-xl bg-surface-base border border-edge-default',
                  'px-4 py-2.5 text-[14px] text-ink-primary',
                  'focus:outline-none focus:ring-2 focus:ring-edge-default/30 transition-shadow'
                )}
              />
            </div>

            {/* Submit error */}
            {submitError && <ErrorNote message={submitError} onDismiss={() => setSubmitError(null)} />}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 pb-10">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-ink-secondary hover:text-ink-primary hover:bg-surface-raised transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
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
      </main>
    </div>
  )
}

// ── Small helper ──────────────────────────────────────────────────────────────

function ErrorNote({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-status-error/30 bg-status-error/8 px-3 py-2 mb-2">
      <AlertCircle className="h-3.5 w-3.5 text-status-error shrink-0" />
      <p className="text-[12px] text-status-error flex-1">{message}</p>
      <button type="button" onClick={onDismiss} className="text-status-error/60 hover:text-status-error ml-1">
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
