import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TriggerBadge } from '../../src/components/TriggerBadge/TriggerBadge'

describe('TriggerBadge', () => {
  it('calls onEdit and blocks the click from bubbling', () => {
    const onEdit = vi.fn()
    const onParentClick = vi.fn()

    render(
      <div onClick={onParentClick}>
        <TriggerBadge onEdit={onEdit} />
      </div>
    )

    const button = screen.getByRole('button', { name: '✏️ Edit visually' })
    const event = createEvent.click(button, { bubbles: true, cancelable: true })
    fireEvent(button, event)

    expect(event.defaultPrevented).toBe(true)
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onParentClick).not.toHaveBeenCalled()
  })
})
