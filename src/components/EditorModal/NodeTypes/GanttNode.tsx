import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { GanttNodeData } from '../../../lib/types'

const COLOR: Record<string, string> = {
  active: '#5c7cfa', done: '#37b24d', crit: '#f03e3e', '': '#74c0fc',
}

export function GanttNode({ data }: NodeProps<GanttNodeData>) {
  return (
    <div style={{ background: COLOR[data.status] ?? COLOR[''], color: 'white',
      padding: '8px 14px', borderRadius: 20, fontSize: 12, minWidth: 120, cursor: 'grab' }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ fontWeight: 600 }}>{data.label}</div>
      <div style={{ fontSize: 10, opacity: 0.85 }}>{data.section} · {data.duration}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
