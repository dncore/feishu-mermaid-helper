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

    const task = line.match(/^(.+?)\s*:\s*(.+)$/)
    if (!task) continue

    const [, rawLabel, rest] = task
    const parts = rest.split(',').map(p => p.trim()).filter(Boolean)

    let idx = 0
    let status: GanttNodeData['status'] = ''
    let id: string | undefined
    let startDate: string | undefined

    if (idx < parts.length && /^(active|done|crit)$/.test(parts[idx])) {
      status = parts[idx++] as GanttNodeData['status']
    }

    if (idx < parts.length - 1) {
      const candidate = parts[idx]
      const isDate = /^\d{4}-\d{2}-\d{2}$/.test(candidate)
      const isDuration = /^\d+[dwMy]$/.test(candidate)
      const isAfter = candidate.startsWith('after ')
      if (!isDate && !isDuration && !isAfter) {
        id = candidate
        idx++
      }
    }

    if (idx < parts.length - 1) {
      startDate = parts[idx++]
    }

    const duration = parts.slice(idx).join(', ')

    nodes.push({
      id: id || `task${nodes.length}`,
      type: 'ganttNode',
      position: { x: 0, y: y++ * 80 },
      data: { label: rawLabel.trim(), section, duration, startDate, status },
    })
  }

  return { nodes, edges: [] }
}
