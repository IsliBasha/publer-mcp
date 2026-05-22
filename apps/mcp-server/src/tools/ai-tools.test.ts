import { describe, it, expect } from 'vitest'
import { scoreCaption, extractHashtags, generateFallbackHashtags } from './ai-tools.js'

describe('scoreCaption', () => {
  it('returns at least 50 for plain text', () => {
    expect(scoreCaption('plain text', 'linkedin')).toBeGreaterThanOrEqual(50)
  })

  it('adds points for a question mark', () => {
    const without = scoreCaption('Hello world', 'linkedin')
    const with_ = scoreCaption('Hello world?', 'linkedin')
    expect(with_).toBeGreaterThan(without)
  })

  it('adds points for an exclamation mark', () => {
    const without = scoreCaption('Hello world', 'linkedin')
    const with_ = scoreCaption('Hello world!', 'linkedin')
    expect(with_).toBeGreaterThan(without)
  })

  it('adds points for multiline content', () => {
    const single = scoreCaption('single line', 'linkedin')
    const multi = scoreCaption('line 1\nline 2', 'linkedin')
    expect(multi).toBeGreaterThan(single)
  })

  it('adds points for emoji', () => {
    const without = scoreCaption('Hello world', 'linkedin')
    const with_ = scoreCaption('Hello world 🚀', 'linkedin')
    expect(with_).toBeGreaterThan(without)
  })

  it('never exceeds 100', () => {
    const score = scoreCaption('Hello? Great! 🚀\nLine 2\nLine 3', 'twitter')
    expect(score).toBeLessThanOrEqual(100)
  })

  it('never goes below 0', () => {
    const score = scoreCaption('x', 'linkedin')
    expect(score).toBeGreaterThanOrEqual(0)
  })
})

describe('extractHashtags', () => {
  it('extracts lines starting with #', () => {
    const text = 'Caption\n#hello\n#world'
    expect(extractHashtags(text)).toEqual(['#hello', '#world'])
  })

  it('ignores lines that do not start with #', () => {
    const text = 'Normal line\n#hashtag\nAnother line'
    expect(extractHashtags(text)).toEqual(['#hashtag'])
  })

  it('returns empty array when no hashtags present', () => {
    expect(extractHashtags('No hashtags here')).toEqual([])
  })

  it('takes only the first word from a # line', () => {
    const text = '#tag1 extra text\n#tag2'
    expect(extractHashtags(text)).toEqual(['#tag1', '#tag2'])
  })

  it('trims whitespace before checking for #', () => {
    const text = '  #trimmed  \n#normal'
    expect(extractHashtags(text)).toEqual(['#trimmed', '#normal'])
  })
})

describe('generateFallbackHashtags', () => {
  it('returns at most the requested count', () => {
    const tags = generateFallbackHashtags('social media marketing', 'instagram', 5)
    expect(tags.length).toBeLessThanOrEqual(5)
  })

  it('includes platform-specific tags for tiktok', () => {
    const tags = generateFallbackHashtags('content', 'tiktok', 10)
    const tiktokTags = ['#fyp', '#foryou', '#trending', '#viral']
    expect(tags.some((t) => tiktokTags.includes(t))).toBe(true)
  })

  it('includes niche-derived tag when niche is provided', () => {
    const tags = generateFallbackHashtags('product', 'linkedin', 10, 'SaaS')
    expect(tags.some((t) => t.toLowerCase().includes('saas'))).toBe(true)
  })

  it('returns unique hashtags with no duplicates', () => {
    const tags = generateFallbackHashtags('social media', 'instagram', 15)
    expect(new Set(tags).size).toBe(tags.length)
  })

  it('all returned tags start with #', () => {
    const tags = generateFallbackHashtags('tech startup', 'twitter', 5)
    expect(tags.every((t) => t.startsWith('#'))).toBe(true)
  })
})
