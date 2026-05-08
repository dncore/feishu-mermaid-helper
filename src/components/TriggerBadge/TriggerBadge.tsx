export const BADGE_CSS = `
button.badge {
  background: #5c7cfa; color: white; border: none; border-radius: 6px;
  padding: 5px 10px; font-size: 12px; font-weight: 600; cursor: pointer;
  box-shadow: 0 2px 8px rgba(92,124,250,.5); white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transition: background .15s;
}
button.badge:hover { background: #4263eb; }
`

interface Props { onEdit: () => void }

export function TriggerBadge({ onEdit }: Props) {
  return (
    <button className="badge"
      onClick={e => { e.stopPropagation(); e.preventDefault(); onEdit() }}
      title="Open Mermaid Visual Editor">
      {'✏️'} Edit visually
    </button>
  )
}
