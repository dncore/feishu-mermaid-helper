import { describe, expect, it } from 'vitest'
import type { Edge, Node } from '@xyflow/react'
import { generate } from '../../../src/lib/generator'

describe('generate', () => {
  it('dispatches flowchart generation', () => {
    const code = generate(
      [
        { id: 'A', type: 'flowchartNode', position: { x: 0, y: 0 }, data: { label: 'Start', shape: 'rect' } },
        { id: 'B', type: 'flowchartNode', position: { x: 0, y: 0 }, data: { label: 'End', shape: 'rect' } },
      ] as Node[],
      [{ id: 'e1', source: 'A', target: 'B' }] as Edge[],
      'flowchart'
    )

    expect(code).toContain('graph TD')
  })

  it('dispatches sequence generation', () => {
    const code = generate(
      [
        { id: 'Alice', type: 'sequenceNode', position: { x: 0, y: 0 }, data: { label: 'Alice' } },
        { id: 'Bob', type: 'sequenceNode', position: { x: 0, y: 0 }, data: { label: 'Bob' } },
      ] as Node[],
      [{ id: 'e1', source: 'Alice', target: 'Bob', label: 'Hi', data: { arrowType: '->>' } }] as Edge[],
      'sequence'
    )

    expect(code).toContain('sequenceDiagram')
  })

  it('dispatches class generation', () => {
    const code = generate(
      [{ id: 'Animal', type: 'classNode', position: { x: 0, y: 0 }, data: { name: 'Animal', attributes: [], methods: ['eat()'] } }] as Node[],
      [],
      'class'
    )

    expect(code).toContain('classDiagram')
  })

  it('dispatches ER generation', () => {
    const code = generate(
      [{ id: 'CUSTOMER', type: 'erNode', position: { x: 0, y: 0 }, data: { name: 'CUSTOMER', fields: [] } }] as Node[],
      [{ id: 'e1', source: 'CUSTOMER', target: 'ORDER', label: 'places', data: { cardinality: '||--o{' } }] as Edge[],
      'er'
    )

    expect(code).toContain('erDiagram')
  })

  it('dispatches gantt generation', () => {
    const code = generate(
      [{ id: 'task-1', type: 'ganttNode', position: { x: 0, y: 0 }, data: { label: 'Build', section: 'Dev', duration: '3d', status: '' } }] as Node[],
      [],
      'gantt'
    )

    expect(code).toContain('gantt')
  })

  it('falls back to flowchart generation for unknown types', () => {
    const code = generate(
      [{ id: 'A', type: 'flowchartNode', position: { x: 0, y: 0 }, data: { label: 'Solo', shape: 'rect' } }] as Node[],
      [],
      'unknown'
    )

    expect(code).toContain('graph TD')
    expect(code).toContain('A[Solo]')
  })
})
