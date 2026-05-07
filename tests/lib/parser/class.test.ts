import { describe, it, expect } from 'vitest'
import { parseClass } from '../../../src/lib/parser/class'

describe('parseClass', () => {
  it('parses class with attributes and methods', () => {
    const { nodes } = parseClass('classDiagram\n    class Animal {\n        String name\n        eat()\n    }')
    const a = nodes.find(n => n.id === 'Animal')!
    expect((a.data as { attributes: string[] }).attributes).toContain('String name')
    expect((a.data as { methods: string[] }).methods).toContain('eat()')
  })

  it('parses inheritance relationship', () => {
    const { edges } = parseClass('classDiagram\n    Animal <|-- Dog')
    expect(edges[0].source).toBe('Animal')
    expect(edges[0].target).toBe('Dog')
  })

  it('assigns type classNode to all nodes', () => {
    const { nodes } = parseClass('classDiagram\n    class Foo {}')
    expect(nodes.every(n => n.type === 'classNode')).toBe(true)
  })
})
