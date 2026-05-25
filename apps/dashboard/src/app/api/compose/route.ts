import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const PLATFORM_CHAR_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
  facebook: 63206,
  tiktok: 2200,
  pinterest: 500,
  youtube: 5000,
}

const PLATFORM_HASHTAG_LIMITS: Record<string, number> = {
  twitter: 2,
  linkedin: 5,
  instagram: 30,
  facebook: 10,
  tiktok: 10,
  pinterest: 20,
  youtube: 15,
}

interface ComposeRequest {
  mode: 'body' | 'hashtags'
  topic: string
  platforms: string[]
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  let body: ComposeRequest
  try {
    body = (await req.json()) as ComposeRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { mode, topic, platforms } = body

  if (!topic?.trim()) {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
  }
  if (!platforms?.length) {
    return NextResponse.json({ error: 'At least one platform is required' }, { status: 400 })
  }

  const anthropic = new Anthropic({ apiKey })
  const primaryPlatform = platforms[0] ?? 'linkedin'

  // ── Hashtag mode — JSON response ──────────────────────────────────────────
  if (mode === 'hashtags') {
    const count = Math.min(10, PLATFORM_HASHTAG_LIMITS[primaryPlatform] ?? 10)
    const prompt = [
      `Generate exactly ${count} hashtags for ${platforms.join(' and ')} about:`,
      `"${topic}"`,
      `Return ONLY the hashtags separated by spaces on a single line, each starting with #.`,
      `No explanations, no line breaks, no numbering.`,
    ].join('\n')

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
    return NextResponse.json({ hashtags: text })
  }

  // ── Body mode — streaming plain text ──────────────────────────────────────
  const charLimit = Math.min(...platforms.map((p) => PLATFORM_CHAR_LIMITS[p] ?? 2200))
  const platformList = platforms.join(', ')

  const systemPrompt =
    `You are a professional social media copywriter. ` +
    `Write clear, engaging post body text without hashtags and without emojis. ` +
    `Return ONLY the post body text — no labels, no preamble, no quotes around the output.`

  const userPrompt = [
    `Write a post for ${platformList} about: "${topic}"`,
    `Stay under ${charLimit} characters.`,
    `Do not include hashtags.`,
    `Do not use emojis.`,
    `Return only the post body text.`,
  ].join('\n')

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const msgStream = anthropic.messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        })

        msgStream.on('text', (text) => {
          controller.enqueue(encoder.encode(text))
        })

        await msgStream.finalMessage()
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
