import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { FlowchartNodeData } from '../../../lib/types'

const SHAPE: Record<string, React.CSSProperties> = {
  rect:          { borderRadius: 4 },
  diamond:       { transform: 'rotate(45deg)', width: 60, height: 60 },
  rounded:       { borderRadius: 24 },
  circle:        { borderRadius: '50%', width: 60, height: 60 },
  parallelogram: { transform: 'skewX(-15deg)' },
}

export function FlowchartNode({ data }: NodeProps<FlowchartNodeData>) {
  return (
    <div style={{ background: '#5c7cfa', color: 'white', padding: '8px 14px', fontSize: 13,
      fontWeight: 500, minWidth: 80, textAlign: 'center', border: '2px solid #4263eb',
      cursor: 'grab', ...SHAPE[data.shape] ?? SHAPE.rect }}>
      <Handle type="target" position={Position.Top} />
      <span style={data.shape === 'diamond' ? { transform: 'rotate(-45deg)', display: 'block' } : {}}>
        {data.label}
      </span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
