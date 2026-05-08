import { ATTR_ID } from './detector'

export function highlightBlock(id: string): void {
  const el = document.querySelector(`[${ATTR_ID}="${id}"]`) as HTMLElement | null
  if (!el) return
  const prev = el.style.outline
  el.style.transition = 'outline 0.15s ease'
  el.style.outline = '3px solid #5c7cfa'
  setTimeout(() => { el.style.outline = prev }, 2000)
}
