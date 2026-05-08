import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { SequenceNodeData } from '../../../lib/types'

export function SequenceNode({ data }: NodeProps<Node<SequenceNodeData>>) {
  return (
    <div style={{ background: '#37b24d', color: 'white', padding: '8px 16px', borderRadius: 6,
      fontSize: 13, fontWeight: 600, border: '2px solid #2f9e44', minWidth: 80,
      textAlign: 'center', cursor: 'grab' }}>
      <Handle type="target" position={Position.Left} />
      {data.label}
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
