import styles from './TriggerBadge.module.css'

interface Props { onEdit: () => void }

export function TriggerBadge({ onEdit }: Props) {
  return (
    <button className={styles.badge}
      onClick={e => { e.stopPropagation(); e.preventDefault(); onEdit() }}
      title="Open Mermaid Visual Editor">
      ✏️ Edit visually
    </button>
  )
}
