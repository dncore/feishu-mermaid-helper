import { useCallback, useRef } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, applyNodeChanges, applyEdgeChanges,
  type Connection, type OnNodesChange, type OnEdgesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEditorStore } from '../../../store/editor'
import { generate } from '../../../lib/generator'
import { nodeTypes } from '../NodeTypes'
import { Toolbar } from './Toolbar'
import styles from './VisualCanvas.module.css'

export function VisualCanvas() {
  const { nodes, edges, diagramType, setNodesAndEdges, setCode } = useEditorStore()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function syncCode(n: typeof nodes, e: typeof edges) {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCode(generate(n, e, diagramType)), 150)
  }

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    const next = applyNodeChanges(changes, nodes)
    setNodesAndEdges(next, edges)
    syncCode(next, edges)
  }, [nodes, edges, diagramType])

  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    const next = applyEdgeChanges(changes, edges)
    setNodesAndEdges(nodes, next)
    syncCode(nodes, next)
  }, [nodes, edges, diagramType])

  const onConnect = useCallback((conn: Connection) => {
    const next = addEdge(conn, edges)
    setNodesAndEdges(nodes, next)
    syncCode(nodes, next)
  }, [nodes, edges, diagramType])

  return (
    <div className={styles.wrapper}>
      <Toolbar />
      <div className={styles.canvas}>
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} fitView deleteKeyCode="Delete">
          <Background /><Controls /><MiniMap />
        </ReactFlow>
      </div>
    </div>
  )
}
