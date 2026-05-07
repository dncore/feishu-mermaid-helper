import { describe, it, expect } from 'vitest'
import { generateSequence } from '../../../src/lib/generator/sequence'
import type { Node, Edge } from '@xyflow/react'
import type { SequenceNodeData } from '../../../src/lib/types'

describe('generateSequence', () => {
  it('generates sequenceDiagram with participants and message', () => {
    const nodes: Node<SequenceNodeData>[] = [
      { id: 'Alice', type: 'sequenceNode', position: { x: 0, y: 0 }, data: { label: 'Alice' } },
      { id: 'Bob',   type: 'sequenceNode', position: { x: 200, y: 0 }, data: { label: 'Bob' } },
    ]
    const edges: Edge[] = [{ id: 'e1', source: 'Alice', target: 'Bob', label: 'Hello', data: { arrowType: '->>' } }]
    const code = generateSequence(nodes, edges)
    expect(code).toContain('sequenceDiagram')
    expect(code).toContain('participant Alice')
    expect(code).toContain('Alice->>Bob: Hello')
  })
})
