import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { ErNodeData } from '../../../lib/types'

export function ErNode({ data }: NodeProps<Node<ErNodeData>>) {
  return (
    <div style={{ background: 'white', border: '2px solid #f76707', borderRadius: 6,
      fontSize: 12, minWidth: 160, cursor: 'grab', overflow: 'hidden' }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ background: '#f76707', color: 'white', padding: '6px 10px', fontWeight: 700, textAlign: 'center' }}>
        {data.name}
      </div>
      <div style={{ padding: '4px 10px' }}>
        {data.fields.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 6 }}>
            <span style={{ color: '#868e96' }}>{f.type}</span>
            <span style={{ color: '#495057' }}>{f.name}</span>
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
