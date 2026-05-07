import { describe, it, expect } from 'vitest'
import { parseSequence } from '../../../src/lib/parser/sequence'

describe('parseSequence', () => {
  it('parses participants and messages', () => {
    const { nodes, edges } = parseSequence(
      'sequenceDiagram\n    participant Alice\n    participant Bob\n    Alice->>Bob: Hello\n    Bob->>Alice: Hi'
    )
    expect(nodes).toHaveLength(2)
    expect(edges).toHaveLength(2)
    expect(nodes.find(n => n.id === 'Alice')?.data.label).toBe('Alice')
    expect(edges[0].source).toBe('Alice')
    expect(edges[0].label).toBe('Hello')
  })

  it('infers participants from messages when not declared', () => {
    const { nodes } = parseSequence('sequenceDiagram\n    A->>B: msg')
    expect(nodes.map(n => n.id)).toContain('A')
    expect(nodes.map(n => n.id)).toContain('B')
  })

  it('assigns type sequenceNode to all nodes', () => {
    const { nodes } = parseSequence('sequenceDiagram\n    A->>B: hi')
    expect(nodes.every(n => n.type === 'sequenceNode')).toBe(true)
  })
})
