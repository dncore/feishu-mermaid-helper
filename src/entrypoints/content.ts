import { defineContentScript } from 'wxt/utils/define-content-script'
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root'
import { createRoot, type Root } from 'react-dom/client'
import { createElement } from 'react'
import { startDetector } from '../lib/detector'
import { detectDiagramType } from '../lib/diagramType'
import { useEditorStore } from '../store/editor'
import { TriggerBadge } from '../components/TriggerBadge/TriggerBadge'
import App from '../components/App'

export default defineContentScript({
  matches: ['*://*.feishu.cn/*', '*://*.larksuite.com/*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'feishu-mermaid-editor',
      position: 'overlay',
      zIndex: 9999998,
      onMount(container) {
        const root = createRoot(container)
        root.render(createElement(App))
        return root
      },
      onRemove(root) { root?.unmount() },
    })
    ui.mount()

    const roots: Root[] = []
    const abortControllers: AbortController[] = []

    const stop = startDetector((block) => {
      const diagramType = detectDiagramType(block.code)
      const el = block.element as HTMLElement
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative'

      const wrap = document.createElement('div')
      wrap.setAttribute('data-mermaid-badge', block.id)
      Object.assign(wrap.style, { position: 'absolute', top: '8px', right: '8px', zIndex: '9999', display: 'none' })

      const root = createRoot(wrap)
      root.render(createElement(TriggerBadge, {
        onEdit: () => useEditorStore.getState().openEditor(block.code, diagramType, block.id),
      }))
      roots.push(root)

      const ac = new AbortController()
      const { signal } = ac
      abortControllers.push(ac)

      el.appendChild(wrap)
      el.addEventListener('mouseenter', () => { wrap.style.display = 'block' }, { signal })
      el.addEventListener('mouseleave', (e) => {
        if (wrap.contains(e.relatedTarget as Node)) return
        wrap.style.display = 'none'
      }, { signal })
      wrap.addEventListener('mouseenter', () => { wrap.style.display = 'block' }, { signal })
      wrap.addEventListener('mouseleave', (e) => {
        if (el.contains(e.relatedTarget as Node)) return
        wrap.style.display = 'none'
      }, { signal })
    })

    ctx.onInvalidated(() => {
      stop()
      abortControllers.forEach(ac => ac.abort())
      roots.forEach(r => r.unmount())
    })
  },
})
