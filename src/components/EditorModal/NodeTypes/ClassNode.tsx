import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { ClassNodeData } from '../../../lib/types'

export function ClassNode({ data }: NodeProps<ClassNodeData>) {
  return (
    <div style={{ background: 'white', border: '2px solid #5c7cfa', borderRadius: 6,
      fontSize: 12, minWidth: 160, cursor: 'grab', overflow: 'hidden' }}>
      <Handle type="target" position={Position.Top} />
      <div style={{ background: '#5c7cfa', color: 'white', padding: '6px 10px', fontWeight: 700, textAlign: 'center' }}>
        {data.name}
      </div>
      {data.attributes.length > 0 && (
        <div style={{ padding: '4px 10px', borderBottom: '1px solid #dee2e6' }}>
          {data.attributes.map((a, i) => <div key={i} style={{ color: '#495057' }}>{a}</div>)}
        </div>
      )}
      {data.methods.length > 0 && (
        <div style={{ padding: '4px 10px' }}>
          {data.methods.map((m, i) => <div key={i} style={{ color: '#868e96', fontStyle: 'italic' }}>{m}</div>)}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
