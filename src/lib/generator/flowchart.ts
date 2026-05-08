import type { Node, Edge } from '@xyflow/react'
import type { FlowchartNodeData } from '../types'

function toMermaid(node: Node<FlowchartNodeData>): string {
  const { label, shape } = node.data
  switch (shape) {
    case 'diamond':      return `${node.id}{${label}}`
    case 'circle':       return `${node.id}((${label}))`
    case 'rounded':      return `${node.id}(${label})`
    case 'parallelogram':return `${node.id}[/${label}/]`
    default:             return `${node.id}[${label}]`
  }
}

export function generateFlowchart(nodes: Node[], edges: Edge[]): string {
  const lines = ['graph TD']
  const connected = new Set(edges.flatMap(e => [e.source, e.target]))
  const byId = new Map(nodes.map(n => [n.id, n as Node<FlowchartNodeData>]))

  for (const n of nodes as Node<FlowchartNodeData>[]) {
    if (!connected.has(n.id)) lines.push(`    ${toMermaid(n)}`)
  }
  for (const edge of edges) {
    const src = byId.get(edge.source)
    const tgt = byId.get(edge.target)
    if (!src || !tgt) continue
    const s = (edge.data as { arrowStyle?: string })?.arrowStyle
    const arrow = s === 'none' ? '---' : s === 'dotted' ? '-.->' : s === 'thick' ? '==>' : '-->'
    const lbl = edge.label ? `|${edge.label}|` : ''
    lines.push(`    ${toMermaid(src)} ${arrow}${lbl ? lbl + ' ' : ' '}${toMermaid(tgt)}`)
  }
  return lines.join('\n')
}
