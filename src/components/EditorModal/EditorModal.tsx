import { useState, useEffect, useCallback } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useEditorStore } from '../../store/editor'
import { parse } from '../../lib/parser'
import { highlightBlock } from '../../lib/highlight'
import { CodePanel } from './CodePanel/CodePanel'
import { VisualCanvas } from './VisualCanvas/VisualCanvas'
import styles from './EditorModal.module.css'

export function EditorModal() {
  const { code, diagramType, sourceElementId, closeEditor, setNodesAndEdges, isDirty, showToast } = useEditorStore()
  const [guard, setGuard] = useState(false)

  useEffect(() => {
    const r = parse(code)
    setNodesAndEdges(r.nodes, r.edges)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(() => {
    const cur = useEditorStore.getState().code
    navigator.clipboard.writeText(cur).then(() => {
      closeEditor()
      if (sourceElementId) highlightBlock(sourceElementId)
      showToast('Mermaid code copied — paste it into the code block to update the diagram')
    })
  }, [closeEditor, sourceElementId, showToast])

  const cancel = useCallback(() => {
    if (isDirty()) setGuard(true)
    else closeEditor()
  }, [isDirty, closeEditor])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') cancel()
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cancel, save])

  return (
    <div className={styles.backdrop} onClick={cancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <span className={styles.tag}>{diagramType}</span>
          <span className={styles.title}>Mermaid Visual Editor</span>
          <button className={styles.close} onClick={cancel}>×</button>
        </header>

        <div className={styles.body}>
          <div className={styles.code}><CodePanel /></div>
          <div className={styles.canvas}>
            <ReactFlowProvider><VisualCanvas /></ReactFlowProvider>
          </div>
        </div>

        <footer className={styles.footer}>
          {guard ? (
            <>
              <span className={styles.prompt}>Discard changes?</span>
              <button className={styles.cancelBtn} onClick={() => { setGuard(false); closeEditor() }}>Discard</button>
              <button className={styles.saveBtn} onClick={() => setGuard(false)}>Keep editing</button>
            </>
          ) : (
            <>
              <button className={styles.cancelBtn} onClick={cancel}>Cancel</button>
              <button className={styles.saveBtn} onClick={save}>Copy &amp; Save</button>
            </>
          )}
        </footer>
      </div>
    </div>
  )
}
