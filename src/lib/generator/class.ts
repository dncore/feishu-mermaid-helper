import type { Node, Edge } from '@xyflow/react'
import type { ClassNodeData } from '../types'

export function generateClass(nodes: Node[], edges: Edge[]): string {
  const lines = ['classDiagram']
  for (const n of nodes as Node<ClassNodeData>[]) {
    lines.push(`    class ${n.id} {`)
    for (const a of n.data.attributes) lines.push(`        ${a}`)
    for (const m of n.data.methods) lines.push(`        ${m}`)
    lines.push('    }')
  }
  for (const e of edges) {
    const rel = (e.data as { relType?: string })?.relType ?? '-->'
    const lbl = e.label ? ` : ${e.label}` : ''
    lines.push(`    ${e.source} ${rel} ${e.target}${lbl}`)
  }
  return lines.join('\n')
}
