import { useEffect, useRef, useCallback } from 'react'
import { EditorView, lineNumbers, highlightActiveLine, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { defaultKeymap, historyKeymap, history } from '@codemirror/commands'
import { oneDark } from '@codemirror/theme-one-dark'
import { StreamLanguage } from '@codemirror/language'
import { useEditorStore } from '../../../store/editor'
import { parse } from '../../../lib/parser'
import styles from './CodePanel.module.css'

const mermaidLang = StreamLanguage.define({
  token(stream) {
    if (stream.match(/%%.*$/)) return 'comment'
    if (stream.match(/\b(graph|flowchart|sequenceDiagram|classDiagram|erDiagram|gantt|participant|actor|class|section|title|dateFormat)\b/))
      return 'keyword'
    if (stream.match(/-->|->|-->>|->>|<\|--|==>/)) return 'operator'
    stream.next()
    return null
  },
})

export function CodePanel() {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const syncing = useRef(false)
  const { code, setCode, setNodesAndEdges } = useEditorStore()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onCodeChange = useCallback((next: string) => {
    if (syncing.current) return
    setCode(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      try { const r = parse(next); setNodesAndEdges(r.nodes, r.edges) } catch { /* invalid */ }
    }, 400)
  }, [setCode, setNodesAndEdges])

  useEffect(() => {
    if (!hostRef.current) return
    const view = new EditorView({
      state: EditorState.create({
        doc: code,
        extensions: [
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          lineNumbers(),
          highlightActiveLine(),
          mermaidLang,
          oneDark,
          EditorView.updateListener.of(u => { if (u.docChanged) onCodeChange(u.state.doc.toString()) }),
        ],
      }),
      parent: hostRef.current,
    })
    viewRef.current = view
    return () => { view.destroy(); viewRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync canvas-driven code changes into the editor
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const cur = view.state.doc.toString()
    if (cur === code) return
    syncing.current = true
    view.dispatch({ changes: { from: 0, to: cur.length, insert: code } })
    syncing.current = false
  }, [code])

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>Mermaid Code</div>
      <div ref={hostRef} className={styles.editor} />
    </div>
  )
}
