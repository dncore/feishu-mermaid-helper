import { describe, it, expect, beforeEach, vi } from 'vitest'
import { findMermaidBlocks, ATTR_ID, startDetector } from '../../src/lib/detector'

function appendDiv(cls: string, text: string): HTMLElement {
  const el = document.createElement('div')
  el.className = cls
  el.textContent = text
  document.body.appendChild(el)
  return el
}

function appendCodeBlock(lang: string, text: string): HTMLElement {
  const pre = document.createElement('pre')
  const code = document.createElement('code')
  code.className = `language-${lang}`
  code.textContent = text
  pre.appendChild(code)
  document.body.appendChild(pre)
  return pre
}

beforeEach(() => { document.body.textContent = '' })

describe('findMermaidBlocks', () => {
  it('finds a div.mermaid block', () => {
    appendDiv('mermaid', 'graph TD\n  A --> B')
    const blocks = findMermaidBlocks()
    expect(blocks).toHaveLength(1)
    expect(blocks[0].code).toBe('graph TD\n  A --> B')
  })

  it('finds a pre > code.language-mermaid block', () => {
    appendCodeBlock('mermaid', 'sequenceDiagram\n  A->>B: hi')
    const blocks = findMermaidBlocks()
    expect(blocks).toHaveLength(1)
    expect(blocks[0].code).toContain('sequenceDiagram')
  })

  it('finds a [data-language="mermaid"] block', () => {
    const el = document.createElement('div')
    el.setAttribute('data-language', 'mermaid')
    el.textContent = 'erDiagram'
    document.body.appendChild(el)
    expect(findMermaidBlocks()).toHaveLength(1)
  })

  it('assigns data-mermaid-id attribute and returns matching id', () => {
    appendDiv('mermaid', 'graph TD\n  A-->B')
    const blocks = findMermaidBlocks()
    expect(blocks[0].element.hasAttribute(ATTR_ID)).toBe(true)
    expect(blocks[0].id).toBe(blocks[0].element.getAttribute(ATTR_ID))
  })

  it('returns empty array when no Mermaid blocks present', () => {
    const el = document.createElement('div')
    el.textContent = 'normal content'
    document.body.appendChild(el)
    expect(findMermaidBlocks()).toHaveLength(0)
  })

  it('reuses the existing id on repeated calls', () => {
    appendDiv('mermaid', 'graph TD')
    const first = findMermaidBlocks()
    const second = findMermaidBlocks()
    expect(first[0].id).toBe(second[0].id)
  })

  it('does not duplicate blocks matched by multiple selectors', () => {
    const el = document.createElement('div')
    el.className = 'mermaid'
    el.setAttribute('data-language', 'mermaid')
    el.textContent = 'graph TD\n  A-->B'
    document.body.appendChild(el)

    expect(findMermaidBlocks()).toHaveLength(1)
  })
})

describe('startDetector', () => {
  it('reports existing blocks immediately and newly added blocks once', async () => {
    appendDiv('mermaid', 'graph TD\n  A --> B')
    const onDetected = vi.fn()

    const stop = startDetector(onDetected)
    expect(onDetected).toHaveBeenCalledTimes(1)

    appendDiv('mermaid', 'graph TD\n  B --> C')
    await Promise.resolve()

    expect(onDetected).toHaveBeenCalledTimes(2)

    stop()
    appendDiv('mermaid', 'graph TD\n  C --> D')
    await Promise.resolve()

    expect(onDetected).toHaveBeenCalledTimes(2)
  })
})
