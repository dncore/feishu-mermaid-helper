import type { Node, Edge } from '@xyflow/react'
import type { SequenceNodeData } from '../types'

export function generateSequence(nodes: Node[], edges: Edge[]): string {
  const lines = ['sequenceDiagram']
  for (const n of nodes as Node<SequenceNodeData>[]) {
    lines.push(`    participant ${n.id} as ${n.data.label}`)
  }
  for (const edge of edges) {
    const arrow = (edge.data as { arrowType?: string })?.arrowType ?? '->>'
    lines.push(`    ${edge.source}${arrow}${edge.target}: ${edge.label ?? ''}`)
  }
  return lines.join('\n')
}
