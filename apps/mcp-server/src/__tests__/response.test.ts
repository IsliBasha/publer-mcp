import { describe, it, expect } from 'vitest'
import { successResponse, errorResponse, formatPostList } from '../utils/response.js'

describe('successResponse', () => {
  it('wraps payload in a single text content block', () => {
    const result = successResponse({ id: '1', content: 'hello' })
    expect(result.content).toHaveLength(1)
    expect(result.content[0].type).toBe('text')
  })

  it('serializes the data as JSON', () => {
    const result = successResponse({ platform: 'linkedin', count: 5 })
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.platform).toBe('linkedin')
    expect(parsed.count).toBe(5)
  })

  it('does not set isError', () => {
    const result = successResponse({})
    expect(result.isError).toBeUndefined()
  })

  it('handles arrays', () => {
    const result = successResponse([{ id: '1' }, { id: '2' }])
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed).toHaveLength(2)
  })
})

describe('errorResponse', () => {
  it('sets isError to true', () => {
    const result = errorResponse('Something broke')
    expect(result.isError).toBe(true)
  })

  it('includes error message in serialized JSON', () => {
    const result = errorResponse('Bad API key')
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.error).toBe('Bad API key')
  })

  it('includes details when provided', () => {
    const result = errorResponse('Not found', { postId: 'abc123' })
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.details).toEqual({ postId: 'abc123' })
  })

  it('omits details key when not provided (JSON.stringify drops undefined)', () => {
    const result = errorResponse('Failed')
    const parsed = JSON.parse(result.content[0].text)
    expect('details' in parsed).toBe(false)
  })
})

describe('formatPostList', () => {
  it('includes posts array, total, and count', () => {
    const posts = [{ id: '1' }, { id: '2' }]
    const result = formatPostList(posts, 10)
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.posts).toHaveLength(2)
    expect(parsed.total).toBe(10)
    expect(parsed.count).toBe(2)
  })

  it('count reflects actual posts length not total', () => {
    const result = formatPostList([{ id: '1' }], 99)
    const parsed = JSON.parse(result.content[0].text)
    expect(parsed.count).toBe(1)
    expect(parsed.total).toBe(99)
  })
})
