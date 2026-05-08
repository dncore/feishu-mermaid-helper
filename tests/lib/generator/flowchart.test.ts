import { describe, it, expect } from 'vitest'
import { generateFlowchart } from '../../../src/lib/generator/flowchart'
import type { Node, Edge } from '@xyflow/react'
import type { FlowchartNodeData } from '../../../src/lib/types'

const n = (id: string, label: string, shape = 'rect'): Node<FlowchartNodeData> => ({
  id, type: 'flowchartNode', position: { x: 0, y: 0 },
  data: { label, shape: shape as FlowchartNodeData['shape'] },
})

describe('generateFlowchart', () => {
  it('generates graph TD header with nodes and edge', () => {
    const code = generateFlowchart([n('A', 'Start'), n('B', 'End')], [{ id: 'e1', source: 'A', target: 'B' }])
    expect(code).toContain('graph TD')
    expect(code).toContain('A[Start]')
    expect(code).toContain('-->')
  })

  it('uses {label} for diamond nodes', () => {
    const code = generateFlowchart([n('A', 'X'), n('D', 'Check?', 'diamond')], [{ id: 'e1', source: 'A', target: 'D' }])
    expect(code).toContain('D{Check?}')
  })

  it('uses [/label/] for parallelogram nodes', () => {
    const code = generateFlowchart([n('A', 'X'), n('I', 'Input', 'parallelogram')], [{ id: 'e1', source: 'A', target: 'I' }])
    expect(code).toContain('I[/Input/]')
  })
})
