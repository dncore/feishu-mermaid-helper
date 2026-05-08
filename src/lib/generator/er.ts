import type { Node, Edge } from '@xyflow/react'
import type { ErNodeData } from '../types'

export function generateEr(nodes: Node[], edges: Edge[]): string {
  const lines = ['erDiagram']
  for (const e of edges) {
    const card = (e.data as { cardinality?: string })?.cardinality ?? '||--||'
    lines.push(`    ${e.source} ${card} ${e.target} : "${e.label ?? ''}"`)
  }
  for (const n of nodes as Node<ErNodeData>[]) {
    if (n.data.fields.length > 0) {
      lines.push(`    ${n.id} {`)
      for (const f of n.data.fields) lines.push(`        ${f.type} ${f.name}`)
      lines.push('    }')
    }
  }
  return lines.join('\n')
}
