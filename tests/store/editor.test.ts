import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '../../src/store/editor'

beforeEach(() => useEditorStore.getState().closeEditor())

describe('EditorStore', () => {
  it('starts closed', () => {
    expect(useEditorStore.getState().isOpen).toBe(false)
  })

  it('openEditor sets isOpen, code, diagramType, sourceElementId', () => {
    useEditorStore.getState().openEditor('graph TD\n  A --> B', 'flowchart', 'blk-1')
    const s = useEditorStore.getState()
    expect(s.isOpen).toBe(true)
    expect(s.code).toBe('graph TD\n  A --> B')
    expect(s.diagramType).toBe('flowchart')
    expect(s.sourceElementId).toBe('blk-1')
  })

  it('isDirty is false when code equals initialCode', () => {
    useEditorStore.getState().openEditor('graph TD', 'flowchart', 'x')
    expect(useEditorStore.getState().isDirty()).toBe(false)
  })

  it('isDirty is true after setCode', () => {
    useEditorStore.getState().openEditor('graph TD', 'flowchart', 'x')
    useEditorStore.getState().setCode('graph LR')
    expect(useEditorStore.getState().isDirty()).toBe(true)
  })

  it('closeEditor resets all fields', () => {
    useEditorStore.getState().openEditor('graph TD', 'flowchart', 'x')
    useEditorStore.getState().closeEditor()
    const s = useEditorStore.getState()
    expect(s.isOpen).toBe(false)
    expect(s.code).toBe('')
    expect(s.sourceElementId).toBeNull()
  })

  it('setNodesAndEdges updates nodes and edges', () => {
    const node = { id: 'a', type: 'default', position: { x: 0, y: 0 }, data: {} }
    const edge = { id: 'e1', source: 'a', target: 'b' }
    useEditorStore.getState().setNodesAndEdges([node] as never, [edge] as never)
    expect(useEditorStore.getState().nodes).toHaveLength(1)
    expect(useEditorStore.getState().edges).toHaveLength(1)
  })

  it('showToast and dismissToast control toastMessage', () => {
    useEditorStore.getState().showToast('Copied!')
    expect(useEditorStore.getState().toastMessage).toBe('Copied!')
    useEditorStore.getState().dismissToast()
    expect(useEditorStore.getState().toastMessage).toBeNull()
  })
})
