import type { Node, Edge } from '@xyflow/react'
import type { ErNodeData, ParseResult } from '../types'

export function parseEr(code: string): ParseResult {
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'))
  const entities = new Map<string, Array<{ name: string; type: string }>>()
  const edges: Edge[] = []
  let current: string | null = null

  for (const line of lines.slice(1)) {
    if (line === '}') { current = null; continue }

    if (current) {
      const f = line.match(/^(\w+)\s+(\w[\w-]*)/)
      if (f) entities.get(current)!.push({ type: f[1], name: f[2] })
      continue
    }

    const block = line.match(/^([\w-]+)\s*\{$/)
    if (block) {
      current = block[1]
      if (!entities.has(current)) entities.set(current, [])
      continue
    }

    // Inline: ENTITY { type field }
    const inline = line.match(/^([\w-]+)\s*\{(.+)\}$/)
    if (inline) {
      const name = inline[1]
      if (!entities.has(name)) entities.set(name, [])
      const f = inline[2].trim().match(/^(\w+)\s+(\w[\w-]*)/)
      if (f) entities.get(name)!.push({ type: f[1], name: f[2] })
      continue
    }

    const rel = line.match(/^([\w-]+)\s+([|o}{]{2,6}--[|o}{]{2,6})\s+([\w-]+)\s*:\s*(.+)$/)
    if (rel) {
      const [, e1, cardinality, e2, label] = rel
      if (!entities.has(e1)) entities.set(e1, [])
      if (!entities.has(e2)) entities.set(e2, [])
      edges.push({ id: `e${edges.length}-${e1}-${e2}`, source: e1, target: e2, label: label.trim(), data: { cardinality } })
    }
  }

  const nodes: Node<ErNodeData>[] = [...entities.entries()].map(([name, fields], i) => ({
    id: name, type: 'erNode',
    position: { x: (i % 3) * 300, y: Math.floor(i / 3) * 220 },
    data: { name, fields },
  }))
  return { nodes, edges }
}
