import { describe, expect, it } from 'vitest'
import { parse } from '../../../src/lib/parser'

describe('parse', () => {
  it('dispatches flowchart diagrams to the flowchart parser', () => {
    const { nodes, edges } = parse('graph TD\n    A --> B')

    expect(nodes.map(node => node.type)).toEqual(['flowchartNode', 'flowchartNode'])
    expect(edges).toHaveLength(1)
  })

  it('dispatches sequence diagrams to the sequence parser', () => {
    const { nodes, edges } = parse('sequenceDiagram\n    Alice->>Bob: hello')

    expect(nodes.map(node => node.type)).toEqual(['sequenceNode', 'sequenceNode'])
    expect(edges[0].data).toEqual({ arrowType: '->>' })
  })

  it('dispatches class diagrams to the class parser', () => {
    const { nodes } = parse('classDiagram\n    class Animal {\n        eat()\n    }')

    expect(nodes[0].type).toBe('classNode')
  })

  it('dispatches ER diagrams to the ER parser', () => {
    const { nodes, edges } = parse('erDiagram\n    CUSTOMER {\n        string name\n    }\n    CUSTOMER ||--o{ ORDER : places')

    expect(nodes.map(node => node.type)).toContain('erNode')
    expect(edges[0].data).toEqual({ cardinality: '||--o{' })
  })

  it('dispatches gantt diagrams to the gantt parser', () => {
    const { nodes, edges } = parse('gantt\n    section Dev\n        Build :2024-01-01, 3d')

    expect(nodes[0].type).toBe('ganttNode')
    expect(edges).toEqual([])
  })

  it('falls back to the flowchart parser for unknown input', () => {
    expect(parse('just some text')).toEqual({ nodes: [], edges: [] })
  })
})
