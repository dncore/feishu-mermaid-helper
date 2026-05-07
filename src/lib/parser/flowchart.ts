import type { Node, Edge } from '@xyflow/react'
import type { FlowchartNodeData, FlowShape, ParseResult } from '../types'

function extractNodeRef(raw: string): { id: string; label: string; shape: FlowShape } {
  const m = raw.match(
    /^([A-Za-z0-9_-]+)(?:\[([^\]]+)\]|\{([^}]+)\}|\(\(([^)]+)\)\)|\(([^)]+)\)|>([^\]]+)\])?$/
  )
  if (!m) return { id: raw, label: raw, shape: 'rect' }
  const [, id, rect, diamond, circle, rounded, flag] = m
  const label = (rect ?? diamond ?? circle ?? rounded ?? flag ?? id).trim()
  const shape: FlowShape = diamond ? 'diamond' : circle ? 'circle' : rounded ? 'rounded' : flag ? 'parallelogram' : 'rect'
  return { id, label, shape }
}

export function parseFlowchart(code: string): ParseResult {
  const nodeMap = new Map<string, { label: string; shape: FlowShape }>()
  const edges: Edge[] = []
  const skip = /^(%%|subgraph|end$|style\s|classDef\s|class\s\w+\s\w)/

  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !skip.test(l))

  const seg = '([A-Za-z0-9_-]+(?:\\[[^\\]]+\\]|\\{[^}]+\\}|\\(\\([^)]+\\)\\)|\\([^)]+\\)|>[^\\]]+\\])?)'
  const edgeRe = new RegExp(`^${seg}\\s*(-->|---|\\-\\.\\->|==>)\\s*(?:\\|([^|]*)\\|)?\\s*${seg}$`)

  for (const line of lines.slice(1)) {
    const em = line.match(edgeRe)
    if (em) {
      const [, srcRaw, style, edgeLabel, tgtRaw] = em
      const src = extractNodeRef(srcRaw)
      const tgt = extractNodeRef(tgtRaw)
      if (!nodeMap.has(src.id)) nodeMap.set(src.id, { label: src.label, shape: src.shape })
      if (!nodeMap.has(tgt.id)) nodeMap.set(tgt.id, { label: tgt.label, shape: tgt.shape })
      edges.push({
        id: `e${edges.length}-${src.id}-${tgt.id}`,
        source: src.id,
        target: tgt.id,
        label: edgeLabel?.trim() || undefined,
        data: { arrowStyle: style === '---' ? 'none' : style === '-.->' ? 'dotted' : style === '==>' ? 'thick' : 'arrow' },
      })
      continue
    }
    const nm = line.match(/^([A-Za-z0-9_-]+(?:\[[^\]]+\]|\{[^}]+\}|\([^)]+\)|>[^\]]+\])?)\s*$/)
    if (nm) {
      const n = extractNodeRef(nm[1])
      if (!nodeMap.has(n.id)) nodeMap.set(n.id, { label: n.label, shape: n.shape })
    }
  }

  const nodes: Node<FlowchartNodeData>[] = [...nodeMap.entries()].map(([id, { label, shape }], i) => ({
    id, type: 'flowchartNode',
    position: { x: (i % 4) * 220, y: Math.floor(i / 4) * 130 },
    data: { label, shape },
  }))

  return { nodes, edges }
}
