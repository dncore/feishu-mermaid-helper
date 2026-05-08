import { useEditorStore } from '../store/editor'
import { EditorModal } from './EditorModal/EditorModal'
import { Toast } from './Toast/Toast'

export default function App() {
  const isOpen = useEditorStore(s => s.isOpen)
  return <>{isOpen && <EditorModal />}<Toast /></>
}
