import { NextRequest, NextResponse } from 'next/server'
import { getPubServices } from '@/lib/publer.server'
import { z } from 'zod'

const API_SERVER_URL = process.env.API_SERVER_URL ?? 'http://localhost:3001'

// ── GET /api/posts ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const services = getPubServices()
    if (!services) {
      return NextResponse.json({ error: 'PUBLER_API_KEY is not configured' }, { status: 503 })
    }
    const { posts } = services
    const data = await posts.listScheduledPosts({
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
      platform: searchParams.get('platform') ?? undefined,
      limit: searchParams.has('limit') ? Number(searchParams.get('limit')) : undefined,
    })
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch posts'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── POST /api/posts ────────────────────────────────────────────────────────────
const CreatePostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000),
  platforms: z.array(z.string()).min(1, 'Select at least one platform'),
  scheduledAt: z.string().datetime({ message: 'scheduledAt must be a valid ISO 8601 datetime' }),
  accountIds: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = CreatePostSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.errors[0]?.message ?? 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    const upstream = await fetch(`${API_SERVER_URL}/api/posts/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })

    const json = await upstream.json() as Record<string, unknown>

    if (!upstream.ok) {
      const status = upstream.status === 400 ? 400 : 502
      return NextResponse.json({ error: json.error ?? 'api-server error' }, { status })
    }

    const data = (json.data ?? json) as Record<string, unknown>
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'api-server unreachable' }, { status: 502 })
  }
}
