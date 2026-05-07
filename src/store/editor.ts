import { create } from 'zustand'
import type { Node, Edge } from '@xyflow/react'
import type { DiagramType } from '../lib/types'

interface EditorState {
  isOpen: boolean
  code: string
  initialCode: string
  nodes: Node[]
  edges: Edge[]
  diagramType: DiagramType
  sourceElementId: string | null
  toastMessage: string | null
  openEditor: (code: string, diagramType: DiagramType, sourceId: string) => void
  closeEditor: () => void
  setCode: (code: string) => void
  setNodesAndEdges: (nodes: Node[], edges: Edge[]) => void
  showToast: (msg: string) => void
  dismissToast: () => void
  isDirty: () => boolean
}

export const useEditorStore = create<EditorState>((set, get) => ({
  isOpen: false,
  code: '',
  initialCode: '',
  nodes: [],
  edges: [],
  diagramType: 'unknown',
  sourceElementId: null,
  toastMessage: null,

  openEditor: (code, diagramType, sourceId) =>
    set({ isOpen: true, code, initialCode: code, nodes: [], edges: [], diagramType, sourceElementId: sourceId }),

  closeEditor: () =>
    set({ isOpen: false, code: '', initialCode: '', nodes: [], edges: [], sourceElementId: null }),

  setCode: (code) => set({ code }),

  setNodesAndEdges: (nodes, edges) => set({ nodes, edges }),

  showToast: (msg) => set({ toastMessage: msg }),

  dismissToast: () => set({ toastMessage: null }),

  isDirty: () => get().code !== get().initialCode,
}))
