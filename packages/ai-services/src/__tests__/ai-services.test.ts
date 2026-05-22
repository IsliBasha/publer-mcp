import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CaptionService, HashtagService, ContentCalendarService } from '@publer-mcp/ai-services'

function makeMockAnthropicClient(textResponse: string) {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: textResponse }],
      }),
    },
  }
}

describe('CaptionService', () => {
  it('returns caption with correct platform and tone', async () => {
    const client = makeMockAnthropicClient('This is a great LinkedIn post about AI!')
    const service = new CaptionService(client as any)

    const result = await service.generate({
      topic: 'AI in marketing',
      platform: 'linkedin',
      tone: 'professional',
    })

    expect(result.caption).toBe('This is a great LinkedIn post about AI!')
    expect(result.platform).toBe('linkedin')
    expect(result.tone).toBe('professional')
    expect(result.characterCount).toBeGreaterThan(0)
  })

  it('assigns score between 0 and 100', async () => {
    const client = makeMockAnthropicClient('Short post #ai 🚀')
    const service = new CaptionService(client as any)

    const result = await service.generate({
      topic: 'test',
      platform: 'twitter',
      tone: 'casual',
    })

    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('estimates high engagement for caption with hashtags and emoji', async () => {
    const client = makeMockAnthropicClient('Amazing insights here! #AI #Marketing 🔥')
    const service = new CaptionService(client as any)

    const result = await service.generate({
      topic: 'test',
      platform: 'instagram',
      tone: 'viral',
    })

    expect(result.estimatedEngagement).toBe('high')
  })
})

describe('HashtagService', () => {
  it('parses JSON array response and prepends # to each tag', async () => {
    const client = makeMockAnthropicClient('["marketing","digitalMarketing","growthhacking"]')
    const service = new HashtagService(client as any)

    const result = await service.generate({
      topic: 'growth marketing',
      platform: 'instagram',
    })

    expect(result.hashtags).toContain('#marketing')
    expect(result.hashtags).toContain('#digitalMarketing')
    expect(result.platform).toBe('instagram')
  })

  it('does not double-prefix already-prefixed hashtags', async () => {
    const client = makeMockAnthropicClient('["#ai","#tech"]')
    const service = new HashtagService(client as any)

    const result = await service.generate({ topic: 'tech', platform: 'twitter' })
    result.hashtags.forEach((h) => {
      expect(h.startsWith('#')).toBe(true)
      expect(h.startsWith('##')).toBe(false)
    })
  })

  it('falls back to line-split parsing when JSON is malformed', async () => {
    const client = makeMockAnthropicClient('marketing\ndigitalMarketing\ngrowthhacking')
    const service = new HashtagService(client as any)

    const result = await service.generate({ topic: 'test', platform: 'linkedin' })
    expect(result.hashtags.length).toBeGreaterThan(0)
  })
})

describe('ContentCalendarService', () => {
  it('returns 7 entries for a full week', async () => {
    const mockCalendar = JSON.stringify(
      Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        dayName: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][i],
        topic: `Topic for day ${i + 1}`,
        caption: `Caption for day ${i + 1}`,
        hashtags: ['#brand', '#growth'],
      }))
    )

    const client = makeMockAnthropicClient(mockCalendar)
    const service = new ContentCalendarService(client as any)

    const result = await service.generateWeek({
      brand: 'Acme',
      industry: 'SaaS',
      platforms: ['linkedin'],
    })

    expect(result).toHaveLength(7)
    expect(result[0].platform).toBe('linkedin')
    expect(result[3].dayName).toBe('Thursday')
  })

  it('returns fallback 7 entries when JSON parsing fails', async () => {
    const client = makeMockAnthropicClient('This is not JSON at all')
    const service = new ContentCalendarService(client as any)

    const result = await service.generateWeek({
      brand: 'TestBrand',
      industry: 'Retail',
      platforms: ['instagram'],
    })

    expect(result).toHaveLength(7)
    expect(result[0].dayName).toBe('Monday')
  })
})
