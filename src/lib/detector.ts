export const ATTR_ID = 'data-mermaid-id'

const SELECTORS = [
  'div.mermaid',
  'pre > code.language-mermaid',
  '[data-language="mermaid"]',
  '.code-block [class*="mermaid"]',
]

export interface DetectedBlock {
  element: Element
  code: string
  id: string
}

function extractCode(el: Element): string {
  const inner = el.querySelector('code') ?? el.querySelector('pre')
  return ((inner ?? el).textContent ?? '').trim()
}

export function findMermaidBlocks(root: Element = document.body): DetectedBlock[] {
  const found: DetectedBlock[] = []
  const seen = new Set<Element>()

  for (const selector of SELECTORS) {
    for (const el of root.querySelectorAll(selector)) {
      if (seen.has(el)) continue
      seen.add(el)
      const code = extractCode(el)
      if (!code) continue
      const existingId = el.getAttribute(ATTR_ID)
      const id = existingId ?? crypto.randomUUID()
      if (!existingId) el.setAttribute(ATTR_ID, id)
      found.push({ element: el, code, id })
    }
  }

  return found
}

export function startDetector(onDetected: (block: DetectedBlock) => void): () => void {
  const handled = new Set<string>()

  function scan() {
    for (const block of findMermaidBlocks()) {
      if (!handled.has(block.id)) {
        handled.add(block.id)
        onDetected(block)
      }
    }
  }

  scan()
  const observer = new MutationObserver(scan)
  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}
