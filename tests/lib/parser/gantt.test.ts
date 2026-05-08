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

  it('captures start date from task definition', () => {
    const { nodes } = parseGantt('gantt\n    dateFormat YYYY-MM-DD\n    section S\n        Build :t1, 2024-03-15, 7d')
    expect(nodes[0].data.startDate).toBe('2024-03-15')
    expect(nodes[0].data.duration).toBe('7d')
  })

  it('preserves "after dep" as startDate', () => {
    const { nodes } = parseGantt('gantt\n    dateFormat YYYY-MM-DD\n    section S\n        Test :active, t2, after t1, 3d')
    expect(nodes[0].data.startDate).toBe('after t1')
    expect(nodes[0].data.duration).toBe('3d')
  })
})
