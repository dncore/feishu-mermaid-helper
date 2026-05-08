import { defineContentScript, createShadowRootUi } from 'wxt/client'
import { createRoot } from 'react-dom/client'
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

    const stop = startDetector((block) => {
      const diagramType = detectDiagramType(block.code)
      const el = block.element as HTMLElement
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative'

      const wrap = document.createElement('div')
      wrap.setAttribute('data-mermaid-badge', block.id)
      Object.assign(wrap.style, { position: 'absolute', top: '8px', right: '8px', zIndex: '9999', display: 'none' })

      createRoot(wrap).render(createElement(TriggerBadge, {
        onEdit: () => useEditorStore.getState().openEditor(block.code, diagramType, block.id),
      }))

      el.appendChild(wrap)
      el.addEventListener('mouseenter', () => { wrap.style.display = 'block' })
      el.addEventListener('mouseleave', () => { wrap.style.display = 'none' })
      wrap.addEventListener('mouseenter', () => { wrap.style.display = 'block' })
      wrap.addEventListener('mouseleave', () => { wrap.style.display = 'none' })
    })

    ctx.onInvalidated(stop)
  },
})
