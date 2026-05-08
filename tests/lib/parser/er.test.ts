import { describe, it, expect } from 'vitest'
import { parseEr } from '../../../src/lib/parser/er'

describe('parseEr', () => {
  it('parses entity with fields', () => {
    const { nodes } = parseEr('erDiagram\n    CUSTOMER {\n        string name\n        string address\n    }')
    const c = nodes.find(n => n.id === 'CUSTOMER')!
    const fields = (c.data as { fields: Array<{ name: string; type: string }> }).fields
    expect(fields).toHaveLength(2)
    expect(fields[0]).toEqual({ type: 'string', name: 'name' })
  })

  it('parses relationship with cardinality', () => {
    const { edges } = parseEr('erDiagram\n    CUSTOMER ||--o{ ORDER : places')
    expect(edges[0].source).toBe('CUSTOMER')
    expect(edges[0].target).toBe('ORDER')
    expect(edges[0].label).toBe('places')
  })

  it('assigns type erNode to all nodes', () => {
    const { nodes } = parseEr('erDiagram\n    CUSTOMER { string name }')
    expect(nodes.every(n => n.type === 'erNode')).toBe(true)
  })
})
