import { describe, it, expect } from 'vitest'
import { generateGantt } from '../../../src/lib/generator/gantt'
import type { Node } from '@xyflow/react'
import type { GanttNodeData } from '../../../src/lib/types'

describe('generateGantt', () => {
  it('generates gantt header with section and task', () => {
    const nodes: Node<GanttNodeData>[] = [{
      id: 't1', type: 'ganttNode', position: { x: 0, y: 0 },
      data: { label: 'Build feature', section: 'Dev', duration: '5d', status: '' },
    }]
    const code = generateGantt(nodes, [])
    expect(code).toContain('gantt')
    expect(code).toContain('section Dev')
    expect(code).toContain('Build feature')
    expect(code).toContain('5d')
  })
})
