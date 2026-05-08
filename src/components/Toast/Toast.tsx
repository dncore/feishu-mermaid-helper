import { useEffect } from 'react'
import { useEditorStore } from '../../store/editor'
import styles from './Toast.module.css'

export function Toast() {
  const { toastMessage, dismissToast } = useEditorStore()
  useEffect(() => {
    if (!toastMessage) return
    const t = setTimeout(dismissToast, 4000)
    return () => clearTimeout(t)
  }, [toastMessage, dismissToast])
  if (!toastMessage) return null
  return <div className={styles.toast} onClick={dismissToast}>{toastMessage}</div>
}
