import { FlowchartNode } from './FlowchartNode'
import { SequenceNode } from './SequenceNode'
import { ClassNode } from './ClassNode'
import { ErNode } from './ErNode'
import { GanttNode } from './GanttNode'

export const nodeTypes = {
  flowchartNode: FlowchartNode,
  sequenceNode:  SequenceNode,
  classNode:     ClassNode,
  erNode:        ErNode,
  ganttNode:     GanttNode,
}
