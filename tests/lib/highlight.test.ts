import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ATTR_ID } from '../../src/lib/detector'
import { highlightBlock } from '../../src/lib/highlight'

beforeEach(() => {
  document.body.textContent = ''
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('highlightBlock', () => {
  it('does nothing when the target block is missing', () => {
    expect(() => highlightBlock('missing')).not.toThrow()
  })

  it('temporarily highlights the matched block and restores the previous outline', () => {
    const el = document.createElement('div')
    el.setAttribute(ATTR_ID, 'block-1')
    el.style.outline = '1px dashed red'
    document.body.appendChild(el)

    highlightBlock('block-1')

    expect(el.style.transition).toBe('outline 0.15s ease')
    expect(el.style.outline).toBe('3px solid #5c7cfa')

    vi.advanceTimersByTime(2000)

    expect(el.style.outline).toBe('1px dashed red')
  })
})
