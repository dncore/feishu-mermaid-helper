import type { Node, Edge } from '@xyflow/react'
import type { DiagramType } from '../types'
import { generateFlowchart } from './flowchart'
import { generateSequence } from './sequence'
import { generateClass } from './class'
import { generateEr } from './er'
import { generateGantt } from './gantt'

export function generate(nodes: Node[], edges: Edge[], type: DiagramType): string {
  switch (type) {
    case 'flowchart': return generateFlowchart(nodes, edges)
    case 'sequence':  return generateSequence(nodes, edges)
    case 'class':     return generateClass(nodes, edges)
    case 'er':        return generateEr(nodes, edges)
    case 'gantt':     return generateGantt(nodes, edges)
    default:          return generateFlowchart(nodes, edges)
  }
}
