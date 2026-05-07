import type { DiagramType } from './types'

const TYPE_MAP: Array<[RegExp, DiagramType]> = [
  [/^\s*(graph|flowchart)\b/m, 'flowchart'],
  [/^\s*sequenceDiagram\b/m, 'sequence'],
  [/^\s*classDiagram\b/m, 'class'],
  [/^\s*erDiagram\b/m, 'er'],
  [/^\s*gantt\b/m, 'gantt'],
]

export function detectDiagramType(code: string): DiagramType {
  for (const [re, type] of TYPE_MAP) {
    if (re.test(code)) return type
  }
  return 'unknown'
}
