import type { Node, Edge } from '@xyflow/react'
import type { ClassNodeData, ParseResult } from '../types'

export function parseClass(code: string): ParseResult {
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'))
  const classes = new Map<string, { attributes: string[]; methods: string[] }>()
  const edges: Edge[] = []
  let current: string | null = null

  for (const line of lines.slice(1)) {
    if (line === '}') { current = null; continue }

    const open = line.match(/^class\s+(\w+)\s*(?:\{)?$/)
    if (open) {
      current = open[1]
      if (!classes.has(current)) classes.set(current, { attributes: [], methods: [] })
      continue
    }

    if (current) {
      const member = line.replace(/^[+\-#~]/, '').trim()
      if (!member) continue
      const cls = classes.get(current)!
      if (member.endsWith(')') || /\w+\s*\(/.test(member)) cls.methods.push(member)
      else cls.attributes.push(member)
      continue
    }

    const rel = line.match(/^(\w+)\s*(<\|--|<--|<\.\.|\.\.>|--|\*--|o--|-->|<\|\.\.|\.\.<\|)\s*(\w+)(?:\s*:\s*(.+))?$/)
    if (rel) {
      const [, src, relType, tgt, label] = rel
      if (!classes.has(src)) classes.set(src, { attributes: [], methods: [] })
      if (!classes.has(tgt)) classes.set(tgt, { attributes: [], methods: [] })
      edges.push({ id: `e${edges.length}-${src}-${tgt}`, source: src, target: tgt, label: label?.trim(), data: { relType } })
    }
  }

  const nodes: Node<ClassNodeData>[] = [...classes.entries()].map(([name, { attributes, methods }], i) => ({
    id: name, type: 'classNode',
    position: { x: (i % 3) * 280, y: Math.floor(i / 3) * 200 },
    data: { name, attributes, methods },
  }))
  return { nodes, edges }
}
