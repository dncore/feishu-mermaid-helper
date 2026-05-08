import type { Node } from '@xyflow/react'
import type { GanttNodeData } from '../types'

export function generateGantt(nodes: Node[], _edges: unknown[]): string {
  const lines = ['gantt', '    dateFormat YYYY-MM-DD']
  const sections = new Map<string, Node<GanttNodeData>[]>()
  for (const n of nodes as Node<GanttNodeData>[]) {
    const s = n.data.section || 'default'
    if (!sections.has(s)) sections.set(s, [])
    sections.get(s)!.push(n)
  }
  for (const [sec, tasks] of sections) {
    if (sec !== 'default') lines.push(`    section ${sec}`)
    for (const t of tasks) {
      const sp = t.data.status ? `${t.data.status}, ` : ''
      lines.push(`    ${t.data.label} :${sp}${t.id}, ${t.data.startDate || '2024-01-01'}, ${t.data.duration}`)
    }
  }
  return lines.join('\n')
}
