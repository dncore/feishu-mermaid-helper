import { describe, it, expect } from 'vitest'
import { generateClass } from '../../../src/lib/generator/class'
import type { Node, Edge } from '@xyflow/react'
import type { ClassNodeData } from '../../../src/lib/types'

describe('generateClass', () => {
  it('generates class block with members', () => {
    const nodes: Node<ClassNodeData>[] = [{
      id: 'Animal', type: 'classNode', position: { x: 0, y: 0 },
      data: { name: 'Animal', attributes: ['String name'], methods: ['eat()'] },
    }]
    const code = generateClass(nodes, [])
    expect(code).toContain('classDiagram')
    expect(code).toContain('class Animal {')
    expect(code).toContain('String name')
    expect(code).toContain('eat()')
  })

  it('generates relationships', () => {
    const nodes: Node<ClassNodeData>[] = [
      { id: 'A', type: 'classNode', position: { x: 0, y: 0 }, data: { name: 'A', attributes: [], methods: [] } },
      { id: 'B', type: 'classNode', position: { x: 0, y: 0 }, data: { name: 'B', attributes: [], methods: [] } },
    ]
    const edges: Edge[] = [{ id: 'e1', source: 'A', target: 'B', data: { relType: '<|--' }, label: 'extends' }]
    expect(generateClass(nodes, edges)).toContain('A <|-- B : extends')
  })
})
