import type { Node, Edge } from '@xyflow/react'
import type { SequenceNodeData, ParseResult } from '../types'

export function parseSequence(code: string): ParseResult {
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'))
  const participants = new Map<string, string>()
  const edges: Edge[] = []

  for (const line of lines.slice(1)) {
    const part = line.match(/^(?:participant|actor)\s+(\S+)(?:\s+as\s+(.+))?$/)
    if (part) { participants.set(part[1], (part[2] ?? part[1]).trim()); continue }

    const msg = line.match(/^(\S+)\s*(->>?|-->>?|-[x)]-?|--[x)]-?)\s*(\S+)\s*:\s*(.+)$/)
    if (msg) {
      const [, src, arrow, tgt, label] = msg
      if (!participants.has(src)) participants.set(src, src)
      if (!participants.has(tgt)) participants.set(tgt, tgt)
      edges.push({ id: `e${edges.length}-${src}-${tgt}`, source: src, target: tgt, label: label.trim(), data: { arrowType: arrow } })
    }
  }

  const nodes: Node<SequenceNodeData>[] = [...participants.entries()].map(([id, label], i) => ({
    id, type: 'sequenceNode', position: { x: i * 200, y: 0 }, data: { label },
  }))

  return { nodes, edges }
}
