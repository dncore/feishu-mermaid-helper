import { describe, it, expect } from 'vitest'
import { generateEr } from '../../../src/lib/generator/er'
import type { Node, Edge } from '@xyflow/react'
import type { ErNodeData } from '../../../src/lib/types'

describe('generateEr', () => {
  it('generates entity with fields', () => {
    const nodes: Node<ErNodeData>[] = [{
      id: 'CUSTOMER', type: 'erNode', position: { x: 0, y: 0 },
      data: { name: 'CUSTOMER', fields: [{ type: 'string', name: 'name' }] },
    }]
    const code = generateEr(nodes, [])
    expect(code).toContain('erDiagram')
    expect(code).toContain('CUSTOMER {')
    expect(code).toContain('string name')
  })

  it('generates relationship line', () => {
    const nodes: Node<ErNodeData>[] = [
      { id: 'A', type: 'erNode', position: { x: 0, y: 0 }, data: { name: 'A', fields: [] } },
      { id: 'B', type: 'erNode', position: { x: 0, y: 0 }, data: { name: 'B', fields: [] } },
    ]
    const edges: Edge[] = [{ id: 'e1', source: 'A', target: 'B', label: 'has', data: { cardinality: '||--o{' } }]
    expect(generateEr(nodes, edges)).toContain('A ||--o{ B : "has"')
  })
})
