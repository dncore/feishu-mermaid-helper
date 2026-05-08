import { describe, it, expect } from 'vitest'
import { parseGantt } from '../../../src/lib/parser/gantt'

describe('parseGantt', () => {
  it('parses tasks with sections', () => {
    const code = 'gantt\n    dateFormat YYYY-MM-DD\n    section Dev\n        Build :t1, 2024-01-01, 7d\n        Test :active, t2, after t1, 3d'
    const { nodes } = parseGantt(code)
    expect(nodes).toHaveLength(2)
    expect(nodes[0].data.section).toBe('Dev')
    expect(nodes[0].data.label).toBe('Build')
  })

  it('captures task status', () => {
    const { nodes } = parseGantt('gantt\n    dateFormat YYYY-MM-DD\n    section S\n        Done task :done, t1, 2024-01-01, 3d')
    expect(nodes[0].data.status).toBe('done')
  })

  it('assigns type ganttNode to all nodes', () => {
    const { nodes } = parseGantt('gantt\n    dateFormat YYYY-MM-DD\n    section S\n        A :a1, 2024-01-01, 3d')
    expect(nodes.every(n => n.type === 'ganttNode')).toBe(true)
  })
})
