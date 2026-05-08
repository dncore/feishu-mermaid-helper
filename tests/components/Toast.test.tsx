import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Toast } from '../../src/components/Toast/Toast'
import { useEditorStore } from '../../src/store/editor'

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useEditorStore.getState().dismissToast()
  })

  afterEach(() => {
    cleanup()
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    useEditorStore.getState().dismissToast()
  })

  it('renders nothing when there is no toast message', () => {
    const { container } = render(<Toast />)

    expect(container).toBeEmptyDOMElement()
  })

  it('dismisses the toast when clicked', () => {
    act(() => {
      useEditorStore.getState().showToast('Copied!')
    })
    render(<Toast />)

    fireEvent.click(screen.getByText('Copied!'))

    expect(useEditorStore.getState().toastMessage).toBeNull()
  })

  it('auto-dismisses the toast after four seconds', () => {
    act(() => {
      useEditorStore.getState().showToast('Saved!')
    })
    render(<Toast />)

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(screen.queryByText('Saved!')).not.toBeInTheDocument()
    expect(useEditorStore.getState().toastMessage).toBeNull()
  })
})
