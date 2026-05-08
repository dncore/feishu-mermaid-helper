export const ATTR_ID = 'data-mermaid-id'

// Block type ID for Feishu's built-in Mermaid ISV plugin
const FEISHU_MERMAID_BLOCK_TYPE = 'blk_631fefbbae02400430b8f9f4'

const SELECTORS = [
  'div.mermaid',
  'pre > code.language-mermaid',
  '[data-language="mermaid"]',
  '.code-block [class*="mermaid"]',
]

const DEBUG = true

function dbg(...args: unknown[]) {
  if (DEBUG) console.log('[feishu-mermaid]', ...args)
}

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
    const matches = root.querySelectorAll(selector)
    if (matches.length) dbg(`selector "${selector}" matched ${matches.length} element(s)`)
    for (const el of matches) {
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

  // Feishu ISV Mermaid blocks — rendered inside cross-origin iframes, code not in DOM
  const iframes = root.querySelectorAll(`iframe[block-type-id="${FEISHU_MERMAID_BLOCK_TYPE}"]`)
  if (iframes.length) dbg(`feishu ISV iframe matched ${iframes.length} element(s)`)
  for (const iframe of iframes) {
    const container = (iframe.closest('.isv-block-container') ?? iframe.parentElement) as Element | null
    if (!container || seen.has(container)) continue
    seen.add(container)
    const existingId = container.getAttribute(ATTR_ID)
    const id = existingId ?? crypto.randomUUID()
    if (!existingId) container.setAttribute(ATTR_ID, id)
    dbg('feishu mermaid block detected, id=', id)
    found.push({ element: container, code: '', id })
  }

  return found
}

export function startDetector(onDetected: (block: DetectedBlock) => void): () => void {
  const handled = new Set<string>()

  function scan() {
    const blocks = findMermaidBlocks()
    dbg(`scan: found ${blocks.length} block(s), ${handled.size} already handled`)
    for (const block of blocks) {
      if (!handled.has(block.id)) {
        handled.add(block.id)
        dbg('new block detected, id=', block.id, 'code preview:', block.code.slice(0, 60))
        onDetected(block)
      }
    }
  }

  dbg('detector starting, watching document.body')
  scan()
  const observer = new MutationObserver(scan)
  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}
