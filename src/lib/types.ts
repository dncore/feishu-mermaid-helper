import type { Node, Edge } from '@xyflow/react'

export type DiagramType = 'flowchart' | 'sequence' | 'class' | 'er' | 'gantt' | 'unknown'

export type FlowShape = 'rect' | 'diamond' | 'rounded' | 'circle' | 'parallelogram'

export interface FlowchartNodeData extends Record<string, unknown> {
  label: string
  shape: FlowShape
}

export interface SequenceNodeData extends Record<string, unknown> {
  label: string
}

export interface ClassNodeData extends Record<string, unknown> {
  name: string
  attributes: string[]
  methods: string[]
}

export interface ErNodeData extends Record<string, unknown> {
  name: string
  fields: Array<{ name: string; type: string }>
}

export interface GanttNodeData extends Record<string, unknown> {
  label: string
  section: string
  duration: string
  status: '' | 'active' | 'done' | 'crit'
}

export interface ParseResult {
  nodes: Node[]
  edges: Edge[]
}
