import { describe, it, expect } from 'vitest'
import { cn, formatNumber, formatPercent } from './utils'

describe('formatNumber', () => {
  it('returns the number as-is below 1000', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(999)).toBe('999')
  })

  it('formats thousands with one decimal and K suffix', () => {
    expect(formatNumber(1_000)).toBe('1.0K')
    expect(formatNumber(9_420)).toBe('9.4K')
    expect(formatNumber(48_320)).toBe('48.3K')
    expect(formatNumber(999_999)).toBe('1000.0K')
  })

  it('formats millions with one decimal and M suffix', () => {
    expect(formatNumber(1_000_000)).toBe('1.0M')
    expect(formatNumber(1_500_000)).toBe('1.5M')
    expect(formatNumber(124_800_000)).toBe('124.8M')
  })
})

describe('formatPercent', () => {
  it('prefixes positive values with +', () => {
    expect(formatPercent(3.2)).toBe('+3.2%')
    expect(formatPercent(0)).toBe('+0.0%')
  })

  it('does not double-prefix negative values', () => {
    expect(formatPercent(-2.1)).toBe('-2.1%')
  })

  it('rounds to one decimal place', () => {
    expect(formatPercent(1.567)).toBe('+1.6%')
    expect(formatPercent(-0.004)).toBe('-0.0%')
  })
})

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolves tailwind conflicts in favor of the last class', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('drops falsy values', () => {
    expect(cn('foo', false && 'bar', undefined, 'baz')).toBe('foo baz')
  })
})
