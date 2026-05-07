import { describe, it, expect } from 'vitest'
import { parseFlowchart } from '../../../src/lib/parser/flowchart'

describe('parseFlowchart', () => {
  it('parses two-node graph and one edge', () => {
    const { nodes, edges } = parseFlowchart('graph TD\n    A[Start] --> B[End]')
    expect(nodes).toHaveLength(2)
    expect(edges).toHaveLength(1)
    expect(nodes.find(n => n.id === 'A')?.data.label).toBe('Start')
    expect(edges[0].source).toBe('A')
    expect(edges[0].target).toBe('B')
  })

  it('detects diamond shape for {label}', () => {
    const { nodes } = parseFlowchart('graph TD\n    A[S] --> B{Decision?}')
    expect(nodes.find(n => n.id === 'B')?.data.shape).toBe('diamond')
  })

  it('captures edge label from |label| syntax', () => {
    const { edges } = parseFlowchart('graph TD\n    A --> |yes| B')
    expect(edges[0].label).toBe('yes')
  })

  it('assigns type flowchartNode to all nodes', () => {
    const { nodes } = parseFlowchart('graph TD\n    A --> B')
    expect(nodes.every(n => n.type === 'flowchartNode')).toBe(true)
  })

  it('assigns positions to all nodes', () => {
    const { nodes } = parseFlowchart('graph TD\n    A --> B --> C')
    expect(nodes.every(n => n.position != null)).toBe(true)
  })
})
