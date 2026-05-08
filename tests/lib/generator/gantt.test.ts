import { describe, it, expect } from 'vitest'
import { generateGantt } from '../../../src/lib/generator/gantt'
import type { Node } from '@xyflow/react'
import type { GanttNodeData } from '../../../src/lib/types'

describe('generateGantt', () => {
  it('uses startDate when provided instead of hardcoded date', () => {
    const nodes: Node<GanttNodeData>[] = [{
      id: 't1', type: 'ganttNode', position: { x: 0, y: 0 },
      data: { label: 'Deploy', section: 'Release', duration: '1d', status: '', startDate: '2025-06-01' },
    }]
    const code = generateGantt(nodes, [])
    expect(code).toContain('2025-06-01')
    expect(code).not.toContain('2024-01-01')
  })
})
