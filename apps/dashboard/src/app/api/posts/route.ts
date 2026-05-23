import { NextRequest, NextResponse } from 'next/server'
import { getPubServices } from '@/lib/publer.server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const { posts } = getPubServices()
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
