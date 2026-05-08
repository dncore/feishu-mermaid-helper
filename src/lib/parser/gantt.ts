import type { Node } from '@xyflow/react'
import type { GanttNodeData, ParseResult } from '../types'

export function parseGantt(code: string): ParseResult {
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'))
  const nodes: Node<GanttNodeData>[] = []
  let section = 'default'
  let y = 0

  for (const line of lines.slice(1)) {
    if (/^(title|dateFormat|axisFormat|excludes)\b/.test(line)) continue
    const sec = line.match(/^section\s+(.+)$/)
    if (sec) { section = sec[1].trim(); continue }
    const task = line.match(/^(.+?)\s*:\s*(active|done|crit)?,?\s*([\w-]+)?,?\s*[\w-]+,\s*(.+)$/)
    if (task) {
      const [, rawLabel, status, id, duration] = task
      nodes.push({
        id: id?.trim() || `task${nodes.length}`,
        type: 'ganttNode',
        position: { x: 0, y: y++ * 80 },
        data: { label: rawLabel.trim(), section, duration: duration.trim(), status: (status?.trim() || '') as GanttNodeData['status'] },
      })
    }
  }

  return { nodes, edges: [] }
}
