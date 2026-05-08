import { useReactFlow } from '@xyflow/react'
import { useEditorStore } from '../../../store/editor'

export function Toolbar() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const { diagramType, nodes, edges, setNodesAndEdges } = useEditorStore()

  function addNode() {
    const id = `node-${Date.now()}`
    const pos = { x: 100 + nodes.length * 30, y: 100 + nodes.length * 30 }
    const data =
      diagramType === 'class'    ? { name: 'NewClass', attributes: [], methods: [] } :
      diagramType === 'er'       ? { name: 'ENTITY', fields: [] } :
      diagramType === 'gantt'    ? { label: 'New Task', section: 'default', duration: '1d', status: '' } :
      diagramType === 'sequence' ? { label: 'Actor' } :
                                   { label: 'Node', shape: 'rect' }
    const type =
      diagramType === 'class'    ? 'classNode' :
      diagramType === 'er'       ? 'erNode' :
      diagramType === 'gantt'    ? 'ganttNode' :
      diagramType === 'sequence' ? 'sequenceNode' : 'flowchartNode'
    setNodesAndEdges([...nodes, { id, type, position: pos, data }], edges)
  }

  const btn: React.CSSProperties = {
    border: '1px solid #dee2e6', background: 'white', borderRadius: 4,
    padding: '3px 8px', cursor: 'pointer', fontSize: 13,
  }

  return (
    <div style={{ display: 'flex', gap: 6, padding: '6px 10px', background: '#f8f9fa',
      borderBottom: '1px solid #dee2e6', alignItems: 'center' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#5c7cfa', background: '#e7f5ff',
        padding: '2px 8px', borderRadius: 10 }}>{diagramType}</span>
      <button style={btn} onClick={() => zoomIn()} title="Zoom In">+</button>
      <button style={btn} onClick={() => zoomOut()} title="Zoom Out">&minus;</button>
      <button style={btn} onClick={() => fitView()} title="Fit View">{'⊡'}</button>
      <button style={btn} onClick={addNode} title="Add Node">+ Node</button>
    </div>
  )
}
