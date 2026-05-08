import type { ParseResult } from '../types'
import { detectDiagramType } from '../diagramType'
import { parseFlowchart } from './flowchart'
import { parseSequence } from './sequence'
import { parseClass } from './class'
import { parseEr } from './er'
import { parseGantt } from './gantt'

export function parse(code: string): ParseResult {
  switch (detectDiagramType(code)) {
    case 'flowchart': return parseFlowchart(code)
    case 'sequence':  return parseSequence(code)
    case 'class':     return parseClass(code)
    case 'er':        return parseEr(code)
    case 'gantt':     return parseGantt(code)
    default:          return parseFlowchart(code)
  }
}
