# Feishu Mermaid Visual Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome extension that detects Mermaid diagrams on Feishu pages, opens a side-by-side visual editor (ReactFlow canvas + CodeMirror code panel) via a hover badge, and saves the updated diagram code to the clipboard.

**Architecture:** WXT + React + Manifest V3. A content script runs a MutationObserver to detect Mermaid blocks across all feishu.cn pages, injects a hover badge per block, and mounts the full editor modal into a Shadow DOM container so styles never conflict with Feishu's CSS. A Zustand store is the single source of truth — bidirectional sync between the code panel and the ReactFlow canvas flows through it.

**Tech Stack:** WXT (MV3 extension framework), React 18, ReactFlow v12 (`@xyflow/react`), CodeMirror 6, Zustand 5, Vitest + jsdom for unit tests.

---

## File Map

See the design spec at `docs/superpowers/specs/2026-05-07-feishu-mermaid-editor-design.md` for the full directory structure. The plan creates files in this order: config → types → store → detector → parsers → generators → node types → UI components → content script → build.


---

## Task 1: Project Scaffold

**Files:** `package.json`, `wxt.config.ts`, `tsconfig.json`, `vitest.config.ts`, `tests/setup.ts`, `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "feishu-mermaid-helper",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wxt",
    "build": "wxt build",
    "test": "vitest run",
    "test:watch": "vitest",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@codemirror/commands": "^6.7.0",
    "@codemirror/language": "^6.10.0",
    "@codemirror/state": "^6.4.0",
    "@codemirror/theme-one-dark": "^6.1.0",
    "@codemirror/view": "^6.35.0",
    "@xyflow/react": "^12.3.0",
    "mermaid": "^11.4.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^14.3.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@wxt-dev/module-react": "^1.1.0",
    "jsdom": "^24.0.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0",
    "wxt": "^0.19.0"
  }
}
```

- [ ] **Step 2: Create wxt.config.ts**

```typescript
import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Feishu Mermaid Visual Editor',
    description: 'Visual editor for Mermaid diagrams in Feishu documents',
    version: '1.0.0',
    permissions: ['clipboardWrite'],
  },
})
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "tests", "*.config.ts"]
}
```

- [ ] **Step 4: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
})
```

- [ ] **Step 5: Create tests/setup.ts**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Create .gitignore**

```
node_modules/
dist/
.wxt/
.output/
.superpowers/
*.local
```

- [ ] **Step 7: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 8: Verify tooling resolves**

```bash
npx tsc --noEmit 2>&1 | head -5
npx vitest run 2>&1 | head -10
```

Expected: TypeScript — no errors (no src files yet). Vitest — 0 tests found.

- [ ] **Step 9: Commit**

```bash
git add package.json wxt.config.ts tsconfig.json vitest.config.ts tests/setup.ts .gitignore
git commit -m "feat: scaffold WXT + React + Vitest project"
```

---

## Task 2: Shared Types

**Files:** `src/lib/types.ts`

- [ ] **Step 1: Write src/lib/types.ts**

```typescript
import type { Node, Edge } from '@xyflow/react'

export type DiagramType = 'flowchart' | 'sequence' | 'class' | 'er' | 'gantt' | 'unknown'

export type FlowShape = 'rect' | 'diamond' | 'rounded' | 'circle' | 'parallelogram'

export interface FlowchartNodeData extends Record<string, unknown> {
  label: string
  shape: FlowShape
}

export interface SequenceNodeData extends Record<string, unknown> {
  label: string
}

export interface ClassNodeData extends Record<string, unknown> {
  name: string
  attributes: string[]
  methods: string[]
}

export interface ErNodeData extends Record<string, unknown> {
  name: string
  fields: Array<{ name: string; type: string }>
}

export interface GanttNodeData extends Record<string, unknown> {
  label: string
  section: string
  duration: string
  status: '' | 'active' | 'done' | 'crit'
}

export interface ParseResult {
  nodes: Node[]
  edges: Edge[]
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: shared TypeScript types"
```

---

## Task 3: Diagram Type Detection

**Files:** `src/lib/diagramType.ts`, `tests/lib/diagramType.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/lib/diagramType.test.ts
import { describe, it, expect } from 'vitest'
import { detectDiagramType } from '../../src/lib/diagramType'

describe('detectDiagramType', () => {
  it('detects flowchart from "graph TD"', () =>
    expect(detectDiagramType('graph TD\n  A --> B')).toBe('flowchart'))
  it('detects flowchart from "flowchart LR"', () =>
    expect(detectDiagramType('flowchart LR\n  A --> B')).toBe('flowchart'))
  it('detects sequence diagram', () =>
    expect(detectDiagramType('sequenceDiagram\n  A->>B: hi')).toBe('sequence'))
  it('detects class diagram', () =>
    expect(detectDiagramType('classDiagram\n  class Foo {}')).toBe('class'))
  it('detects ER diagram', () =>
    expect(detectDiagramType('erDiagram\n  A ||--o{ B : has')).toBe('er'))
  it('detects Gantt', () =>
    expect(detectDiagramType('gantt\n  title My Gantt')).toBe('gantt'))
  it('returns unknown for unrecognized input', () =>
    expect(detectDiagramType('hello world')).toBe('unknown'))
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/lib/diagramType.test.ts
```

Expected: FAIL — `detectDiagramType` not found.

- [ ] **Step 3: Implement src/lib/diagramType.ts**

```typescript
import type { DiagramType } from './types'

const TYPE_MAP: Array<[RegExp, DiagramType]> = [
  [/^\s*(graph|flowchart)\b/m, 'flowchart'],
  [/^\s*sequenceDiagram\b/m, 'sequence'],
  [/^\s*classDiagram\b/m, 'class'],
  [/^\s*erDiagram\b/m, 'er'],
  [/^\s*gantt\b/m, 'gantt'],
]

export function detectDiagramType(code: string): DiagramType {
  for (const [re, type] of TYPE_MAP) {
    if (re.test(code)) return type
  }
  return 'unknown'
}
```

- [ ] **Step 4: Run to confirm pass**

```bash
npx vitest run tests/lib/diagramType.test.ts
```

Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/diagramType.ts tests/lib/diagramType.test.ts
git commit -m "feat: diagram type detection"
```

---

## Task 4: Zustand Editor Store

**Files:** `src/store/editor.ts`, `tests/store/editor.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/store/editor.test.ts
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
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/store/editor.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement src/store/editor.ts**

```typescript
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
```

- [ ] **Step 4: Run to confirm pass**

```bash
npx vitest run tests/store/editor.test.ts
```

Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/store/editor.ts tests/store/editor.test.ts
git commit -m "feat: Zustand editor store"
```

---

## Task 5: Feishu Mermaid Detector

**Files:** `src/lib/detector.ts`, `tests/lib/detector.test.ts`

- [ ] **Step 1: Write the failing tests**

Use `document.createElement` to build DOM fixtures — never set `innerHTML` directly.

```typescript
// tests/lib/detector.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { findMermaidBlocks, ATTR_ID } from '../../src/lib/detector'

function appendDiv(cls: string, text: string): HTMLElement {
  const el = document.createElement('div')
  el.className = cls
  el.textContent = text
  document.body.appendChild(el)
  return el
}

function appendCodeBlock(lang: string, text: string): HTMLElement {
  const pre = document.createElement('pre')
  const code = document.createElement('code')
  code.className = `language-${lang}`
  code.textContent = text
  pre.appendChild(code)
  document.body.appendChild(pre)
  return pre
}

beforeEach(() => { document.body.textContent = '' })

describe('findMermaidBlocks', () => {
  it('finds a div.mermaid block', () => {
    appendDiv('mermaid', 'graph TD\n  A --> B')
    const blocks = findMermaidBlocks()
    expect(blocks).toHaveLength(1)
    expect(blocks[0].code).toBe('graph TD\n  A --> B')
  })

  it('finds a pre > code.language-mermaid block', () => {
    appendCodeBlock('mermaid', 'sequenceDiagram\n  A->>B: hi')
    const blocks = findMermaidBlocks()
    expect(blocks).toHaveLength(1)
    expect(blocks[0].code).toContain('sequenceDiagram')
  })

  it('finds a [data-language="mermaid"] block', () => {
    const el = document.createElement('div')
    el.setAttribute('data-language', 'mermaid')
    el.textContent = 'erDiagram'
    document.body.appendChild(el)
    expect(findMermaidBlocks()).toHaveLength(1)
  })

  it('assigns data-mermaid-id attribute and returns matching id', () => {
    appendDiv('mermaid', 'graph TD\n  A-->B')
    const blocks = findMermaidBlocks()
    expect(blocks[0].element.hasAttribute(ATTR_ID)).toBe(true)
    expect(blocks[0].id).toBe(blocks[0].element.getAttribute(ATTR_ID))
  })

  it('returns empty array when no Mermaid blocks present', () => {
    const el = document.createElement('div')
    el.textContent = 'normal content'
    document.body.appendChild(el)
    expect(findMermaidBlocks()).toHaveLength(0)
  })

  it('reuses the existing id on repeated calls', () => {
    appendDiv('mermaid', 'graph TD')
    const first = findMermaidBlocks()
    const second = findMermaidBlocks()
    expect(first[0].id).toBe(second[0].id)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/lib/detector.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement src/lib/detector.ts**

```typescript
export const ATTR_ID = 'data-mermaid-id'

const SELECTORS = [
  'div.mermaid',
  'pre > code.language-mermaid',
  '[data-language="mermaid"]',
  '.code-block [class*="mermaid"]',
]

export interface DetectedBlock {
  element: Element
  code: string
  id: string
}

function extractCode(el: Element): string {
  const inner = el.querySelector('code') ?? el.querySelector('pre')
  return ((inner ?? el).textContent ?? '').trim()
}

export function findMermaidBlocks(root: Element = document.body): DetectedBlock[] {
  const found: DetectedBlock[] = []
  const seen = new Set<Element>()

  for (const selector of SELECTORS) {
    for (const el of root.querySelectorAll(selector)) {
      if (seen.has(el)) continue
      seen.add(el)
      const code = extractCode(el)
      if (!code) continue
      const existingId = el.getAttribute(ATTR_ID)
      const id = existingId ?? crypto.randomUUID()
      if (!existingId) el.setAttribute(ATTR_ID, id)
      found.push({ element: el, code, id })
    }
  }

  return found
}

export function startDetector(onDetected: (block: DetectedBlock) => void): () => void {
  const handled = new Set<string>()

  function scan() {
    for (const block of findMermaidBlocks()) {
      if (!handled.has(block.id)) {
        handled.add(block.id)
        onDetected(block)
      }
    }
  }

  scan()
  const observer = new MutationObserver(scan)
  observer.observe(document.body, { childList: true, subtree: true })
  return () => observer.disconnect()
}
```

- [ ] **Step 4: Run to confirm pass**

```bash
npx vitest run tests/lib/detector.test.ts
```

Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/detector.ts tests/lib/detector.test.ts
git commit -m "feat: Feishu Mermaid block detector"
```

---

## Task 6: Flowchart Parser + Generator

**Files:** `src/lib/parser/flowchart.ts`, `src/lib/generator/flowchart.ts`, `tests/lib/parser/flowchart.test.ts`, `tests/lib/generator/flowchart.test.ts`

- [ ] **Step 1: Write failing parser tests**

```typescript
// tests/lib/parser/flowchart.test.ts
import { describe, it, expect } from 'vitest'
import { parseFlowchart } from '../../../src/lib/parser/flowchart'

describe('parseFlowchart', () => {
  it('parses two-node graph and one edge', () => {
    const { nodes, edges } = parseFlowchart('graph TD\n    A[Start] --> B[End]')
    expect(nodes).toHaveLength(2)
    expect(edges).toHaveLength(1)
    expect(nodes.find(n => n.id === 'A')?.data.label).toBe('Start')
    expect(edges[0].source).toBe('A')
    expect(edges[0].target).toBe('B')
  })

  it('detects diamond shape for {label}', () => {
    const { nodes } = parseFlowchart('graph TD\n    A[S] --> B{Decision?}')
    expect(nodes.find(n => n.id === 'B')?.data.shape).toBe('diamond')
  })

  it('captures edge label from |label| syntax', () => {
    const { edges } = parseFlowchart('graph TD\n    A --> |yes| B')
    expect(edges[0].label).toBe('yes')
  })

  it('assigns type flowchartNode to all nodes', () => {
    const { nodes } = parseFlowchart('graph TD\n    A --> B')
    expect(nodes.every(n => n.type === 'flowchartNode')).toBe(true)
  })

  it('assigns positions to all nodes', () => {
    const { nodes } = parseFlowchart('graph TD\n    A --> B --> C')
    expect(nodes.every(n => n.position != null)).toBe(true)
  })
})
```

- [ ] **Step 2: Write failing generator tests**

```typescript
// tests/lib/generator/flowchart.test.ts
import { describe, it, expect } from 'vitest'
import { generateFlowchart } from '../../../src/lib/generator/flowchart'
import type { Node, Edge } from '@xyflow/react'
import type { FlowchartNodeData } from '../../../src/lib/types'

const n = (id: string, label: string, shape = 'rect'): Node<FlowchartNodeData> => ({
  id, type: 'flowchartNode', position: { x: 0, y: 0 },
  data: { label, shape: shape as FlowchartNodeData['shape'] },
})

describe('generateFlowchart', () => {
  it('generates graph TD header with nodes and edge', () => {
    const code = generateFlowchart([n('A', 'Start'), n('B', 'End')], [{ id: 'e1', source: 'A', target: 'B' }])
    expect(code).toContain('graph TD')
    expect(code).toContain('A[Start]')
    expect(code).toContain('-->')
  })

  it('uses {label} for diamond nodes', () => {
    const code = generateFlowchart([n('A', 'X'), n('D', 'Check?', 'diamond')], [{ id: 'e1', source: 'A', target: 'D' }])
    expect(code).toContain('D{Check?}')
  })

  it('includes edge label when present', () => {
    const code = generateFlowchart([n('A', 'A'), n('B', 'B')], [{ id: 'e1', source: 'A', target: 'B', label: 'yes' }])
    expect(code).toContain('|yes|')
  })
})
```

- [ ] **Step 3: Run to confirm failure**

```bash
npx vitest run tests/lib/parser/flowchart.test.ts tests/lib/generator/flowchart.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 4: Implement src/lib/parser/flowchart.ts**

```typescript
import type { Node, Edge } from '@xyflow/react'
import type { FlowchartNodeData, FlowShape, ParseResult } from '../types'

function extractNodeRef(raw: string): { id: string; label: string; shape: FlowShape } {
  const m = raw.match(
    /^([A-Za-z0-9_-]+)(?:\[([^\]]+)\]|\{([^}]+)\}|\(\(([^)]+)\)\)|\(([^)]+)\)|>([^\]]+)\])?$/
  )
  if (!m) return { id: raw, label: raw, shape: 'rect' }
  const [, id, rect, diamond, circle, rounded, flag] = m
  const label = (rect ?? diamond ?? circle ?? rounded ?? flag ?? id).trim()
  const shape: FlowShape = diamond ? 'diamond' : circle ? 'circle' : rounded ? 'rounded' : flag ? 'parallelogram' : 'rect'
  return { id, label, shape }
}

export function parseFlowchart(code: string): ParseResult {
  const nodeMap = new Map<string, { label: string; shape: FlowShape }>()
  const edges: Edge[] = []
  const skip = /^(%%|subgraph|end$|style\s|classDef\s|class\s\w+\s\w)/

  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !skip.test(l))

  const seg = '([A-Za-z0-9_-]+(?:\\[[^\\]]+\\]|\\{[^}]+\\}|\\(\\([^)]+\\)\\)|\\([^)]+\\)|>[^\\]]+\\])?)'
  const edgeRe = new RegExp(`^${seg}\\s*(-->|---|-.->|==>)\\s*(?:\\|([^|]*)\\|)?\\s*${seg}$`)

  for (const line of lines.slice(1)) {
    const em = line.match(edgeRe)
    if (em) {
      const [, srcRaw, style, edgeLabel, tgtRaw] = em
      const src = extractNodeRef(srcRaw)
      const tgt = extractNodeRef(tgtRaw)
      if (!nodeMap.has(src.id)) nodeMap.set(src.id, { label: src.label, shape: src.shape })
      if (!nodeMap.has(tgt.id)) nodeMap.set(tgt.id, { label: tgt.label, shape: tgt.shape })
      edges.push({
        id: `e${edges.length}-${src.id}-${tgt.id}`,
        source: src.id,
        target: tgt.id,
        label: edgeLabel?.trim() || undefined,
        data: { arrowStyle: style === '---' ? 'none' : style === '-.->' ? 'dotted' : style === '==>' ? 'thick' : 'arrow' },
      })
      continue
    }
    const nm = line.match(/^([A-Za-z0-9_-]+(?:\[[^\]]+\]|\{[^}]+\}|\([^)]+\))?)\s*$/)
    if (nm) {
      const n = extractNodeRef(nm[1])
      if (!nodeMap.has(n.id)) nodeMap.set(n.id, { label: n.label, shape: n.shape })
    }
  }

  const nodes: Node<FlowchartNodeData>[] = [...nodeMap.entries()].map(([id, { label, shape }], i) => ({
    id, type: 'flowchartNode',
    position: { x: (i % 4) * 220, y: Math.floor(i / 4) * 130 },
    data: { label, shape },
  }))

  return { nodes, edges }
}
```

- [ ] **Step 5: Implement src/lib/generator/flowchart.ts**

```typescript
import type { Node, Edge } from '@xyflow/react'
import type { FlowchartNodeData } from '../types'

function toMermaid(node: Node<FlowchartNodeData>): string {
  const { label, shape } = node.data
  switch (shape) {
    case 'diamond':      return `${node.id}{${label}}`
    case 'circle':       return `${node.id}((${label}))`
    case 'rounded':      return `${node.id}(${label})`
    case 'parallelogram':return `${node.id}[/${label}/]`
    default:             return `${node.id}[${label}]`
  }
}

export function generateFlowchart(nodes: Node[], edges: Edge[]): string {
  const lines = ['graph TD']
  const connected = new Set(edges.flatMap(e => [e.source, e.target]))
  const byId = new Map(nodes.map(n => [n.id, n as Node<FlowchartNodeData>]))

  for (const n of nodes as Node<FlowchartNodeData>[]) {
    if (!connected.has(n.id)) lines.push(`    ${toMermaid(n)}`)
  }
  for (const edge of edges) {
    const src = byId.get(edge.source)
    const tgt = byId.get(edge.target)
    if (!src || !tgt) continue
    const s = (edge.data as { arrowStyle?: string })?.arrowStyle
    const arrow = s === 'none' ? '---' : s === 'dotted' ? '-.->' : s === 'thick' ? '==>' : '-->'
    const lbl = edge.label ? `|${edge.label}|` : ''
    lines.push(`    ${toMermaid(src)} ${arrow}${lbl} ${toMermaid(tgt)}`)
  }
  return lines.join('\n')
}
```

- [ ] **Step 6: Run to confirm pass**

```bash
npx vitest run tests/lib/parser/flowchart.test.ts tests/lib/generator/flowchart.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/parser/flowchart.ts src/lib/generator/flowchart.ts tests/lib/parser/flowchart.test.ts tests/lib/generator/flowchart.test.ts
git commit -m "feat: flowchart parser and generator"
```

---

## Task 7: Sequence Parser + Generator

**Files:** `src/lib/parser/sequence.ts`, `src/lib/generator/sequence.ts`, `tests/lib/parser/sequence.test.ts`, `tests/lib/generator/sequence.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/lib/parser/sequence.test.ts
import { describe, it, expect } from 'vitest'
import { parseSequence } from '../../../src/lib/parser/sequence'

describe('parseSequence', () => {
  it('parses participants and messages', () => {
    const { nodes, edges } = parseSequence(
      'sequenceDiagram\n    participant Alice\n    participant Bob\n    Alice->>Bob: Hello\n    Bob->>Alice: Hi'
    )
    expect(nodes).toHaveLength(2)
    expect(edges).toHaveLength(2)
    expect(nodes.find(n => n.id === 'Alice')?.data.label).toBe('Alice')
    expect(edges[0].source).toBe('Alice')
    expect(edges[0].label).toBe('Hello')
  })

  it('infers participants from messages when not declared', () => {
    const { nodes } = parseSequence('sequenceDiagram\n    A->>B: msg')
    expect(nodes.map(n => n.id)).toContain('A')
    expect(nodes.map(n => n.id)).toContain('B')
  })

  it('assigns type sequenceNode to all nodes', () => {
    const { nodes } = parseSequence('sequenceDiagram\n    A->>B: hi')
    expect(nodes.every(n => n.type === 'sequenceNode')).toBe(true)
  })
})
```

```typescript
// tests/lib/generator/sequence.test.ts
import { describe, it, expect } from 'vitest'
import { generateSequence } from '../../../src/lib/generator/sequence'
import type { Node, Edge } from '@xyflow/react'
import type { SequenceNodeData } from '../../../src/lib/types'

describe('generateSequence', () => {
  it('generates sequenceDiagram with participants and message', () => {
    const nodes: Node<SequenceNodeData>[] = [
      { id: 'Alice', type: 'sequenceNode', position: { x: 0, y: 0 }, data: { label: 'Alice' } },
      { id: 'Bob',   type: 'sequenceNode', position: { x: 200, y: 0 }, data: { label: 'Bob' } },
    ]
    const edges: Edge[] = [{ id: 'e1', source: 'Alice', target: 'Bob', label: 'Hello', data: { arrowType: '->>' } }]
    const code = generateSequence(nodes, edges)
    expect(code).toContain('sequenceDiagram')
    expect(code).toContain('participant Alice')
    expect(code).toContain('Alice->>Bob: Hello')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/lib/parser/sequence.test.ts tests/lib/generator/sequence.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement src/lib/parser/sequence.ts**

```typescript
import type { Node, Edge } from '@xyflow/react'
import type { SequenceNodeData, ParseResult } from '../types'

export function parseSequence(code: string): ParseResult {
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'))
  const participants = new Map<string, string>()
  const edges: Edge[] = []

  for (const line of lines.slice(1)) {
    const part = line.match(/^(?:participant|actor)\s+(\S+)(?:\s+as\s+(.+))?$/)
    if (part) { participants.set(part[1], (part[2] ?? part[1]).trim()); continue }

    const msg = line.match(/^(\S+)\s*(->>?|-->>?|-[x)]-?|--[x)]-?)\s*(\S+)\s*:\s*(.+)$/)
    if (msg) {
      const [, src, arrow, tgt, label] = msg
      if (!participants.has(src)) participants.set(src, src)
      if (!participants.has(tgt)) participants.set(tgt, tgt)
      edges.push({ id: `e${edges.length}-${src}-${tgt}`, source: src, target: tgt, label: label.trim(), data: { arrowType: arrow } })
    }
  }

  const nodes: Node<SequenceNodeData>[] = [...participants.entries()].map(([id, label], i) => ({
    id, type: 'sequenceNode', position: { x: i * 200, y: 0 }, data: { label },
  }))

  return { nodes, edges }
}
```

- [ ] **Step 4: Implement src/lib/generator/sequence.ts**

```typescript
import type { Node, Edge } from '@xyflow/react'
import type { SequenceNodeData } from '../types'

export function generateSequence(nodes: Node[], edges: Edge[]): string {
  const lines = ['sequenceDiagram']
  for (const n of nodes as Node<SequenceNodeData>[]) {
    lines.push(`    participant ${n.id} as ${n.data.label}`)
  }
  for (const edge of edges) {
    const arrow = (edge.data as { arrowType?: string })?.arrowType ?? '->>'
    lines.push(`    ${edge.source}${arrow}${edge.target}: ${edge.label ?? ''}`)
  }
  return lines.join('\n')
}
```

- [ ] **Step 5: Run to confirm pass**

```bash
npx vitest run tests/lib/parser/sequence.test.ts tests/lib/generator/sequence.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/parser/sequence.ts src/lib/generator/sequence.ts tests/lib/parser/sequence.test.ts tests/lib/generator/sequence.test.ts
git commit -m "feat: sequence parser and generator"
```

---

## Task 8: Class Diagram Parser + Generator

**Files:** `src/lib/parser/class.ts`, `src/lib/generator/class.ts`, tests for each.

- [ ] **Step 1: Write failing tests**

```typescript
// tests/lib/parser/class.test.ts
import { describe, it, expect } from 'vitest'
import { parseClass } from '../../../src/lib/parser/class'

describe('parseClass', () => {
  it('parses class with attributes and methods', () => {
    const { nodes } = parseClass('classDiagram\n    class Animal {\n        String name\n        eat()\n    }')
    const a = nodes.find(n => n.id === 'Animal')!
    expect((a.data as { attributes: string[] }).attributes).toContain('String name')
    expect((a.data as { methods: string[] }).methods).toContain('eat()')
  })

  it('parses inheritance relationship', () => {
    const { edges } = parseClass('classDiagram\n    Animal <|-- Dog')
    expect(edges[0].source).toBe('Animal')
    expect(edges[0].target).toBe('Dog')
  })

  it('assigns type classNode to all nodes', () => {
    const { nodes } = parseClass('classDiagram\n    class Foo {}')
    expect(nodes.every(n => n.type === 'classNode')).toBe(true)
  })
})
```

```typescript
// tests/lib/generator/class.test.ts
import { describe, it, expect } from 'vitest'
import { generateClass } from '../../../src/lib/generator/class'
import type { Node, Edge } from '@xyflow/react'
import type { ClassNodeData } from '../../../src/lib/types'

describe('generateClass', () => {
  it('generates class block with members', () => {
    const nodes: Node<ClassNodeData>[] = [{
      id: 'Animal', type: 'classNode', position: { x: 0, y: 0 },
      data: { name: 'Animal', attributes: ['String name'], methods: ['eat()'] },
    }]
    const code = generateClass(nodes, [])
    expect(code).toContain('classDiagram')
    expect(code).toContain('class Animal {')
    expect(code).toContain('String name')
    expect(code).toContain('eat()')
  })

  it('generates relationships', () => {
    const nodes: Node<ClassNodeData>[] = [
      { id: 'A', type: 'classNode', position: { x: 0, y: 0 }, data: { name: 'A', attributes: [], methods: [] } },
      { id: 'B', type: 'classNode', position: { x: 0, y: 0 }, data: { name: 'B', attributes: [], methods: [] } },
    ]
    const edges: Edge[] = [{ id: 'e1', source: 'A', target: 'B', data: { relType: '<|--' }, label: 'extends' }]
    expect(generateClass(nodes, edges)).toContain('A <|-- B : extends')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/lib/parser/class.test.ts tests/lib/generator/class.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement src/lib/parser/class.ts**

```typescript
import type { Node, Edge } from '@xyflow/react'
import type { ClassNodeData, ParseResult } from '../types'

export function parseClass(code: string): ParseResult {
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'))
  const classes = new Map<string, { attributes: string[]; methods: string[] }>()
  const edges: Edge[] = []
  let current: string | null = null

  for (const line of lines.slice(1)) {
    if (line === '}') { current = null; continue }

    const open = line.match(/^class\s+(\w+)\s*(?:\{)?$/)
    if (open) {
      current = open[1]
      if (!classes.has(current)) classes.set(current, { attributes: [], methods: [] })
      continue
    }

    if (current) {
      const member = line.replace(/^[+\-#~]/, '').trim()
      if (!member) continue
      const cls = classes.get(current)!
      if (member.endsWith(')') || /\w+\s*\(/.test(member)) cls.methods.push(member)
      else cls.attributes.push(member)
      continue
    }

    const rel = line.match(/^(\w+)\s*(<\|--|<--|<\.\.|\.\.>|--|\*--|o--|-->|<\|\.\.|\.\.<\|)\s*(\w+)(?:\s*:\s*(.+))?$/)
    if (rel) {
      const [, src, relType, tgt, label] = rel
      if (!classes.has(src)) classes.set(src, { attributes: [], methods: [] })
      if (!classes.has(tgt)) classes.set(tgt, { attributes: [], methods: [] })
      edges.push({ id: `e${edges.length}-${src}-${tgt}`, source: src, target: tgt, label: label?.trim(), data: { relType } })
    }
  }

  const nodes: Node<ClassNodeData>[] = [...classes.entries()].map(([name, { attributes, methods }], i) => ({
    id: name, type: 'classNode',
    position: { x: (i % 3) * 280, y: Math.floor(i / 3) * 200 },
    data: { name, attributes, methods },
  }))
  return { nodes, edges }
}
```

- [ ] **Step 4: Implement src/lib/generator/class.ts**

```typescript
import type { Node, Edge } from '@xyflow/react'
import type { ClassNodeData } from '../types'

export function generateClass(nodes: Node[], edges: Edge[]): string {
  const lines = ['classDiagram']
  for (const n of nodes as Node<ClassNodeData>[]) {
    lines.push(`    class ${n.id} {`)
    for (const a of n.data.attributes) lines.push(`        ${a}`)
    for (const m of n.data.methods) lines.push(`        ${m}`)
    lines.push('    }')
  }
  for (const e of edges) {
    const rel = (e.data as { relType?: string })?.relType ?? '-->'
    const lbl = e.label ? ` : ${e.label}` : ''
    lines.push(`    ${e.source} ${rel} ${e.target}${lbl}`)
  }
  return lines.join('\n')
}
```

- [ ] **Step 5: Run to confirm pass**

```bash
npx vitest run tests/lib/parser/class.test.ts tests/lib/generator/class.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/parser/class.ts src/lib/generator/class.ts tests/lib/parser/class.test.ts tests/lib/generator/class.test.ts
git commit -m "feat: class diagram parser and generator"
```

---

## Task 9: ER Diagram Parser + Generator

**Files:** `src/lib/parser/er.ts`, `src/lib/generator/er.ts`, tests for each.

- [ ] **Step 1: Write failing tests**

```typescript
// tests/lib/parser/er.test.ts
import { describe, it, expect } from 'vitest'
import { parseEr } from '../../../src/lib/parser/er'

describe('parseEr', () => {
  it('parses entity with fields', () => {
    const { nodes } = parseEr('erDiagram\n    CUSTOMER {\n        string name\n        string address\n    }')
    const c = nodes.find(n => n.id === 'CUSTOMER')!
    const fields = (c.data as { fields: Array<{ name: string; type: string }> }).fields
    expect(fields).toHaveLength(2)
    expect(fields[0]).toEqual({ type: 'string', name: 'name' })
  })

  it('parses relationship with cardinality', () => {
    const { edges } = parseEr('erDiagram\n    CUSTOMER ||--o{ ORDER : places')
    expect(edges[0].source).toBe('CUSTOMER')
    expect(edges[0].target).toBe('ORDER')
    expect(edges[0].label).toBe('places')
  })

  it('assigns type erNode to all nodes', () => {
    const { nodes } = parseEr('erDiagram\n    CUSTOMER { string name }')
    expect(nodes.every(n => n.type === 'erNode')).toBe(true)
  })
})
```

```typescript
// tests/lib/generator/er.test.ts
import { describe, it, expect } from 'vitest'
import { generateEr } from '../../../src/lib/generator/er'
import type { Node, Edge } from '@xyflow/react'
import type { ErNodeData } from '../../../src/lib/types'

describe('generateEr', () => {
  it('generates entity with fields', () => {
    const nodes: Node<ErNodeData>[] = [{
      id: 'CUSTOMER', type: 'erNode', position: { x: 0, y: 0 },
      data: { name: 'CUSTOMER', fields: [{ type: 'string', name: 'name' }] },
    }]
    const code = generateEr(nodes, [])
    expect(code).toContain('erDiagram')
    expect(code).toContain('CUSTOMER {')
    expect(code).toContain('string name')
  })

  it('generates relationship line', () => {
    const nodes: Node<ErNodeData>[] = [
      { id: 'A', type: 'erNode', position: { x: 0, y: 0 }, data: { name: 'A', fields: [] } },
      { id: 'B', type: 'erNode', position: { x: 0, y: 0 }, data: { name: 'B', fields: [] } },
    ]
    const edges: Edge[] = [{ id: 'e1', source: 'A', target: 'B', label: 'has', data: { cardinality: '||--o{' } }]
    expect(generateEr(nodes, edges)).toContain('A ||--o{ B : "has"')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/lib/parser/er.test.ts tests/lib/generator/er.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement src/lib/parser/er.ts**

```typescript
import type { Node, Edge } from '@xyflow/react'
import type { ErNodeData, ParseResult } from '../types'

export function parseEr(code: string): ParseResult {
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'))
  const entities = new Map<string, Array<{ name: string; type: string }>>()
  const edges: Edge[] = []
  let current: string | null = null

  for (const line of lines.slice(1)) {
    if (line === '}') { current = null; continue }

    if (current) {
      const f = line.match(/^(\w+)\s+(\w[\w-]*)/)
      if (f) entities.get(current)!.push({ type: f[1], name: f[2] })
      continue
    }

    const block = line.match(/^([\w-]+)\s*\{$/)
    if (block) {
      current = block[1]
      if (!entities.has(current)) entities.set(current, [])
      continue
    }

    // Inline: ENTITY { type field }
    const inline = line.match(/^([\w-]+)\s*\{(.+)\}$/)
    if (inline) {
      const name = inline[1]
      if (!entities.has(name)) entities.set(name, [])
      const f = inline[2].trim().match(/^(\w+)\s+(\w[\w-]*)/)
      if (f) entities.get(name)!.push({ type: f[1], name: f[2] })
      continue
    }

    const rel = line.match(/^([\w-]+)\s+([|o}{]{2,6}--[|o}{]{2,6})\s+([\w-]+)\s*:\s*(.+)$/)
    if (rel) {
      const [, e1, cardinality, e2, label] = rel
      if (!entities.has(e1)) entities.set(e1, [])
      if (!entities.has(e2)) entities.set(e2, [])
      edges.push({ id: `e${edges.length}-${e1}-${e2}`, source: e1, target: e2, label: label.trim(), data: { cardinality } })
    }
  }

  const nodes: Node<ErNodeData>[] = [...entities.entries()].map(([name, fields], i) => ({
    id: name, type: 'erNode',
    position: { x: (i % 3) * 300, y: Math.floor(i / 3) * 220 },
    data: { name, fields },
  }))
  return { nodes, edges }
}
```

- [ ] **Step 4: Implement src/lib/generator/er.ts**

```typescript
import type { Node, Edge } from '@xyflow/react'
import type { ErNodeData } from '../types'

export function generateEr(nodes: Node[], edges: Edge[]): string {
  const lines = ['erDiagram']
  for (const e of edges) {
    const card = (e.data as { cardinality?: string })?.cardinality ?? '||--||'
    lines.push(`    ${e.source} ${card} ${e.target} : "${e.label ?? ''}"`)
  }
  for (const n of nodes as Node<ErNodeData>[]) {
    if (n.data.fields.length > 0) {
      lines.push(`    ${n.id} {`)
      for (const f of n.data.fields) lines.push(`        ${f.type} ${f.name}`)
      lines.push('    }')
    }
  }
  return lines.join('\n')
}
```

- [ ] **Step 5: Run to confirm pass**

```bash
npx vitest run tests/lib/parser/er.test.ts tests/lib/generator/er.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/parser/er.ts src/lib/generator/er.ts tests/lib/parser/er.test.ts tests/lib/generator/er.test.ts
git commit -m "feat: ER diagram parser and generator"
```

---

## Task 10: Gantt Parser + Generator

**Files:** `src/lib/parser/gantt.ts`, `src/lib/generator/gantt.ts`, tests for each.

- [ ] **Step 1: Write failing tests**

```typescript
// tests/lib/parser/gantt.test.ts
import { describe, it, expect } from 'vitest'
import { parseGantt } from '../../../src/lib/parser/gantt'

describe('parseGantt', () => {
  it('parses tasks with sections', () => {
    const code = 'gantt\n    dateFormat YYYY-MM-DD\n    section Dev\n        Build :t1, 2024-01-01, 7d\n        Test :active, t2, after t1, 3d'
    const { nodes } = parseGantt(code)
    expect(nodes).toHaveLength(2)
    expect(nodes[0].data.section).toBe('Dev')
    expect(nodes[0].data.label).toBe('Build')
  })

  it('captures task status', () => {
    const { nodes } = parseGantt('gantt\n    dateFormat YYYY-MM-DD\n    section S\n        Done task :done, t1, 2024-01-01, 3d')
    expect(nodes[0].data.status).toBe('done')
  })

  it('assigns type ganttNode to all nodes', () => {
    const { nodes } = parseGantt('gantt\n    dateFormat YYYY-MM-DD\n    section S\n        A :a1, 2024-01-01, 3d')
    expect(nodes.every(n => n.type === 'ganttNode')).toBe(true)
  })
})
```

```typescript
// tests/lib/generator/gantt.test.ts
import { describe, it, expect } from 'vitest'
import { generateGantt } from '../../../src/lib/generator/gantt'
import type { Node } from '@xyflow/react'
import type { GanttNodeData } from '../../../src/lib/types'

describe('generateGantt', () => {
  it('generates gantt header with section and task', () => {
    const nodes: Node<GanttNodeData>[] = [{
      id: 't1', type: 'ganttNode', position: { x: 0, y: 0 },
      data: { label: 'Build feature', section: 'Dev', duration: '5d', status: '' },
    }]
    const code = generateGantt(nodes, [])
    expect(code).toContain('gantt')
    expect(code).toContain('section Dev')
    expect(code).toContain('Build feature')
    expect(code).toContain('5d')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
npx vitest run tests/lib/parser/gantt.test.ts tests/lib/generator/gantt.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement src/lib/parser/gantt.ts**

```typescript
import type { Node } from '@xyflow/react'
import type { GanttNodeData, ParseResult } from '../types'

export function parseGantt(code: string): ParseResult {
  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'))
  const nodes: Node<GanttNodeData>[] = []
  let section = 'default'
  let y = 0

  for (const line of lines.slice(1)) {
    if (/^(title|dateFormat|axisFormat|excludes)\b/.test(line)) continue
    const sec = line.match(/^section\s+(.+)$/)
    if (sec) { section = sec[1].trim(); continue }
    const task = line.match(/^(.+?)\s*:\s*(active|done|crit)?,?\s*([\w-]+)?,?\s*[\w-]+,\s*(.+)$/)
    if (task) {
      const [, rawLabel, status, id, duration] = task
      nodes.push({
        id: id?.trim() || `task${nodes.length}`,
        type: 'ganttNode',
        position: { x: 0, y: y++ * 80 },
        data: { label: rawLabel.trim(), section, duration: duration.trim(), status: (status?.trim() || '') as GanttNodeData['status'] },
      })
    }
  }

  return { nodes, edges: [] }
}
```

- [ ] **Step 4: Implement src/lib/generator/gantt.ts**

```typescript
import type { Node } from '@xyflow/react'
import type { GanttNodeData } from '../types'

export function generateGantt(nodes: Node[], _edges: unknown[]): string {
  const lines = ['gantt', '    dateFormat YYYY-MM-DD']
  const sections = new Map<string, Node<GanttNodeData>[]>()
  for (const n of nodes as Node<GanttNodeData>[]) {
    const s = n.data.section || 'default'
    if (!sections.has(s)) sections.set(s, [])
    sections.get(s)!.push(n)
  }
  for (const [sec, tasks] of sections) {
    if (sec !== 'default') lines.push(`    section ${sec}`)
    for (const t of tasks) {
      const sp = t.data.status ? `${t.data.status}, ` : ''
      lines.push(`    ${t.data.label} :${sp}${t.id}, 2024-01-01, ${t.data.duration}`)
    }
  }
  return lines.join('\n')
}
```

- [ ] **Step 5: Run to confirm pass**

```bash
npx vitest run tests/lib/parser/gantt.test.ts tests/lib/generator/gantt.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/parser/gantt.ts src/lib/generator/gantt.ts tests/lib/parser/gantt.test.ts tests/lib/generator/gantt.test.ts
git commit -m "feat: Gantt parser and generator"
```

---

## Task 11: Parser + Generator Index Modules

**Files:** `src/lib/parser/index.ts`, `src/lib/generator/index.ts`

- [ ] **Step 1: Write src/lib/parser/index.ts**

```typescript
import type { ParseResult } from '../types'
import { detectDiagramType } from '../diagramType'
import { parseFlowchart } from './flowchart'
import { parseSequence } from './sequence'
import { parseClass } from './class'
import { parseEr } from './er'
import { parseGantt } from './gantt'

export function parse(code: string): ParseResult {
  switch (detectDiagramType(code)) {
    case 'flowchart': return parseFlowchart(code)
    case 'sequence':  return parseSequence(code)
    case 'class':     return parseClass(code)
    case 'er':        return parseEr(code)
    case 'gantt':     return parseGantt(code)
    default:          return parseFlowchart(code)
  }
}
```

- [ ] **Step 2: Write src/lib/generator/index.ts**

```typescript
import type { Node, Edge } from '@xyflow/react'
import type { DiagramType } from '../types'
import { generateFlowchart } from './flowchart'
import { generateSequence } from './sequence'
import { generateClass } from './class'
import { generateEr } from './er'
import { generateGantt } from './gantt'

export function generate(nodes: Node[], edges: Edge[], type: DiagramType): string {
  switch (type) {
    case 'flowchart': return generateFlowchart(nodes, edges)
    case 'sequence':  return generateSequence(nodes, edges)
    case 'class':     return generateClass(nodes, edges)
    case 'er':        return generateEr(nodes, edges)
    case 'gantt':     return generateGantt(nodes, edges)
    default:          return generateFlowchart(nodes, edges)
  }
}
```

- [ ] **Step 3: Run all lib tests**

```bash
npx vitest run tests/lib/
```

Expected: PASS — all tests in `tests/lib/` pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/parser/index.ts src/lib/generator/index.ts
git commit -m "feat: parser and generator dispatch index"
```

---

## Task 12: Highlight Utility

**Files:** `src/lib/highlight.ts`

- [ ] **Step 1: Write src/lib/highlight.ts**

```typescript
import { ATTR_ID } from './detector'

export function highlightBlock(id: string): void {
  const el = document.querySelector(`[${ATTR_ID}="${id}"]`) as HTMLElement | null
  if (!el) return
  const prev = el.style.outline
  el.style.transition = 'outline 0.15s ease'
  el.style.outline = '3px solid #5c7cfa'
  setTimeout(() => { el.style.outline = prev }, 2000)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/highlight.ts
git commit -m "feat: block highlight utility"
```

---

## Task 13: Custom ReactFlow Node Types

**Files:** `src/components/EditorModal/NodeTypes/` (5 node files + index)

- [ ] **Step 1: Write FlowchartNode.tsx**

```tsx
// src/components/EditorModal/NodeTypes/FlowchartNode.tsx
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
```

- [ ] **Step 2: Write SequenceNode.tsx**

```tsx
// src/components/EditorModal/NodeTypes/SequenceNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { SequenceNodeData } from '../../../lib/types'

export function SequenceNode({ data }: NodeProps<SequenceNodeData>) {
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
```

- [ ] **Step 3: Write ClassNode.tsx**

```tsx
// src/components/EditorModal/NodeTypes/ClassNode.tsx
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
```

- [ ] **Step 4: Write ErNode.tsx**

```tsx
// src/components/EditorModal/NodeTypes/ErNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { ErNodeData } from '../../../lib/types'

export function ErNode({ data }: NodeProps<ErNodeData>) {
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
```

- [ ] **Step 5: Write GanttNode.tsx**

```tsx
// src/components/EditorModal/NodeTypes/GanttNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { GanttNodeData } from '../../../lib/types'

const COLOR: Record<string, string> = {
  active: '#5c7cfa', done: '#37b24d', crit: '#f03e3e', '': '#74c0fc',
}

export function GanttNode({ data }: NodeProps<GanttNodeData>) {
  return (
    <div style={{ background: COLOR[data.status] ?? COLOR[''], color: 'white',
      padding: '8px 14px', borderRadius: 20, fontSize: 12, minWidth: 120, cursor: 'grab' }}>
      <Handle type="target" position={Position.Left} />
      <div style={{ fontWeight: 600 }}>{data.label}</div>
      <div style={{ fontSize: 10, opacity: 0.85 }}>{data.section} · {data.duration}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
```

- [ ] **Step 6: Write NodeTypes/index.ts**

```typescript
// src/components/EditorModal/NodeTypes/index.ts
import { FlowchartNode } from './FlowchartNode'
import { SequenceNode } from './SequenceNode'
import { ClassNode } from './ClassNode'
import { ErNode } from './ErNode'
import { GanttNode } from './GanttNode'

export const nodeTypes = {
  flowchartNode: FlowchartNode,
  sequenceNode:  SequenceNode,
  classNode:     ClassNode,
  erNode:        ErNode,
  ganttNode:     GanttNode,
}
```

- [ ] **Step 7: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors in our files.

- [ ] **Step 8: Commit**

```bash
git add src/components/EditorModal/NodeTypes/
git commit -m "feat: custom ReactFlow node types for all 5 diagram types"
```

---

## Task 14: Toolbar + Visual Canvas

**Files:** `src/components/EditorModal/VisualCanvas/Toolbar.tsx`, `VisualCanvas.tsx`, `VisualCanvas.module.css`

- [ ] **Step 1: Write Toolbar.tsx**

```tsx
// src/components/EditorModal/VisualCanvas/Toolbar.tsx
import { useReactFlow } from '@xyflow/react'
import { useEditorStore } from '../../../store/editor'

export function Toolbar() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const { diagramType, nodes, edges, setNodesAndEdges } = useEditorStore()

  function addNode() {
    const id = `node-${Date.now()}`
    const pos = { x: 100 + nodes.length * 30, y: 100 + nodes.length * 30 }
    const data =
      diagramType === 'class'    ? { name: 'NewClass', attributes: [], methods: [] } :
      diagramType === 'er'       ? { name: 'ENTITY', fields: [] } :
      diagramType === 'gantt'    ? { label: 'New Task', section: 'default', duration: '1d', status: '' } :
      diagramType === 'sequence' ? { label: 'Actor' } :
                                   { label: 'Node', shape: 'rect' }
    const type =
      diagramType === 'class'    ? 'classNode' :
      diagramType === 'er'       ? 'erNode' :
      diagramType === 'gantt'    ? 'ganttNode' :
      diagramType === 'sequence' ? 'sequenceNode' : 'flowchartNode'
    setNodesAndEdges([...nodes, { id, type, position: pos, data }], edges)
  }

  const btn: React.CSSProperties = {
    border: '1px solid #dee2e6', background: 'white', borderRadius: 4,
    padding: '3px 8px', cursor: 'pointer', fontSize: 13,
  }

  return (
    <div style={{ display: 'flex', gap: 6, padding: '6px 10px', background: '#f8f9fa',
      borderBottom: '1px solid #dee2e6', alignItems: 'center' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#5c7cfa', background: '#e7f5ff',
        padding: '2px 8px', borderRadius: 10 }}>{diagramType}</span>
      <button style={btn} onClick={() => zoomIn()} title="Zoom In">+</button>
      <button style={btn} onClick={() => zoomOut()} title="Zoom Out">−</button>
      <button style={btn} onClick={() => fitView()} title="Fit View">⊡</button>
      <button style={btn} onClick={addNode} title="Add Node">+ Node</button>
    </div>
  )
}
```

- [ ] **Step 2: Write VisualCanvas.tsx**

```tsx
// src/components/EditorModal/VisualCanvas/VisualCanvas.tsx
import { useCallback, useRef } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, applyNodeChanges, applyEdgeChanges,
  type Connection, type OnNodesChange, type OnEdgesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEditorStore } from '../../../store/editor'
import { generate } from '../../../lib/generator'
import { nodeTypes } from '../NodeTypes'
import { Toolbar } from './Toolbar'
import styles from './VisualCanvas.module.css'

export function VisualCanvas() {
  const { nodes, edges, diagramType, setNodesAndEdges, setCode } = useEditorStore()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function syncCode(n: typeof nodes, e: typeof edges) {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCode(generate(n, e, diagramType)), 150)
  }

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    const next = applyNodeChanges(changes, nodes)
    setNodesAndEdges(next, edges)
    syncCode(next, edges)
  }, [nodes, edges, diagramType])

  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    const next = applyEdgeChanges(changes, edges)
    setNodesAndEdges(nodes, next)
    syncCode(nodes, next)
  }, [nodes, edges, diagramType])

  const onConnect = useCallback((conn: Connection) => {
    const next = addEdge(conn, edges)
    setNodesAndEdges(nodes, next)
    syncCode(nodes, next)
  }, [nodes, edges, diagramType])

  return (
    <div className={styles.wrapper}>
      <Toolbar />
      <div className={styles.canvas}>
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} fitView deleteKeyCode="Delete">
          <Background /><Controls /><MiniMap />
        </ReactFlow>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write VisualCanvas.module.css**

```css
.wrapper { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.canvas  { flex: 1; min-height: 0; }
```

- [ ] **Step 4: Commit**

```bash
git add src/components/EditorModal/VisualCanvas/
git commit -m "feat: ReactFlow visual canvas with toolbar and bidirectional sync"
```

---

## Task 15: Code Panel

**Files:** `src/components/EditorModal/CodePanel/CodePanel.tsx`, `CodePanel.module.css`

- [ ] **Step 1: Write CodePanel.tsx**

```tsx
// src/components/EditorModal/CodePanel/CodePanel.tsx
import { useEffect, useRef, useCallback } from 'react'
import { EditorView, lineNumbers, highlightActiveLine, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { defaultKeymap, historyKeymap, history } from '@codemirror/commands'
import { oneDark } from '@codemirror/theme-one-dark'
import { StreamLanguage } from '@codemirror/language'
import { useEditorStore } from '../../../store/editor'
import { parse } from '../../../lib/parser'
import styles from './CodePanel.module.css'

const mermaidLang = StreamLanguage.define({
  token(stream) {
    if (stream.match(/%%.*$/)) return 'comment'
    if (stream.match(/\b(graph|flowchart|sequenceDiagram|classDiagram|erDiagram|gantt|participant|actor|class|section|title|dateFormat)\b/))
      return 'keyword'
    if (stream.match(/-->|->|-->>|->>|<\|--|==>/)) return 'operator'
    stream.next()
    return null
  },
})

export function CodePanel() {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const syncing = useRef(false)
  const { code, setCode, setNodesAndEdges } = useEditorStore()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onCodeChange = useCallback((next: string) => {
    if (syncing.current) return
    setCode(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      try { const r = parse(next); setNodesAndEdges(r.nodes, r.edges) } catch { /* invalid */ }
    }, 400)
  }, [setCode, setNodesAndEdges])

  useEffect(() => {
    if (!hostRef.current) return
    const view = new EditorView({
      state: EditorState.create({
        doc: code,
        extensions: [
          history(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          lineNumbers(),
          highlightActiveLine(),
          mermaidLang,
          oneDark,
          EditorView.updateListener.of(u => { if (u.docChanged) onCodeChange(u.state.doc.toString()) }),
        ],
      }),
      parent: hostRef.current,
    })
    viewRef.current = view
    return () => { view.destroy(); viewRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync canvas-driven code changes into the editor
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const cur = view.state.doc.toString()
    if (cur === code) return
    syncing.current = true
    view.dispatch({ changes: { from: 0, to: cur.length, insert: code } })
    syncing.current = false
  }, [code])

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>Mermaid Code</div>
      <div ref={hostRef} className={styles.editor} />
    </div>
  )
}
```

- [ ] **Step 2: Write CodePanel.module.css**

```css
.wrapper { display: flex; flex-direction: column; height: 100%; overflow: hidden; border-right: 1px solid #dee2e6; }
.header  { padding: 8px 14px; font-size: 11px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: #868e96; background: #f8f9fa; border-bottom: 1px solid #dee2e6; }
.editor  { flex: 1; overflow: auto; font-size: 13px; }
.editor :global(.cm-editor) { height: 100%; }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/EditorModal/CodePanel/
git commit -m "feat: CodeMirror 6 code panel with Mermaid highlighting"
```

---

## Task 16: Toast + TriggerBadge Components

**Files:** `src/components/Toast/Toast.tsx`, `Toast.module.css`, `src/components/TriggerBadge/TriggerBadge.tsx`, `TriggerBadge.module.css`

- [ ] **Step 1: Write Toast.tsx**

```tsx
// src/components/Toast/Toast.tsx
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
```

- [ ] **Step 2: Write Toast.module.css**

```css
.toast {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  background: #212529; color: white; padding: 10px 20px; border-radius: 8px;
  font-size: 13px; z-index: 10000000; cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,.25);
  animation: in .2s ease;
}
@keyframes in {
  from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
```

- [ ] **Step 3: Write TriggerBadge.tsx**

```tsx
// src/components/TriggerBadge/TriggerBadge.tsx
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
```

- [ ] **Step 4: Write TriggerBadge.module.css**

```css
.badge {
  background: #5c7cfa; color: white; border: none; border-radius: 6px;
  padding: 5px 10px; font-size: 12px; font-weight: 600; cursor: pointer;
  box-shadow: 0 2px 8px rgba(92,124,250,.5); white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transition: background .15s;
}
.badge:hover { background: #4263eb; }
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Toast/ src/components/TriggerBadge/
git commit -m "feat: Toast and TriggerBadge components"
```

---

## Task 17: Editor Modal

**Files:** `src/components/EditorModal/EditorModal.tsx`, `EditorModal.module.css`

- [ ] **Step 1: Write EditorModal.tsx**

```tsx
// src/components/EditorModal/EditorModal.tsx
import { useState, useEffect, useCallback } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useEditorStore } from '../../store/editor'
import { parse } from '../../lib/parser'
import { highlightBlock } from '../../lib/highlight'
import { CodePanel } from './CodePanel/CodePanel'
import { VisualCanvas } from './VisualCanvas/VisualCanvas'
import styles from './EditorModal.module.css'

export function EditorModal() {
  const { code, diagramType, sourceElementId, closeEditor, setNodesAndEdges, isDirty, showToast } = useEditorStore()
  const [guard, setGuard] = useState(false)

  useEffect(() => {
    const r = parse(code)
    setNodesAndEdges(r.nodes, r.edges)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(() => {
    const cur = useEditorStore.getState().code
    navigator.clipboard.writeText(cur).then(() => {
      closeEditor()
      if (sourceElementId) highlightBlock(sourceElementId)
      showToast('Mermaid code copied — paste it into the code block to update the diagram')
    })
  }, [closeEditor, sourceElementId, showToast])

  const cancel = useCallback(() => {
    if (isDirty()) setGuard(true)
    else closeEditor()
  }, [isDirty, closeEditor])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') cancel()
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cancel, save])

  return (
    <div className={styles.backdrop} onClick={cancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <header className={styles.header}>
          <span className={styles.tag}>{diagramType}</span>
          <span className={styles.title}>Mermaid Visual Editor</span>
          <button className={styles.close} onClick={cancel}>×</button>
        </header>

        <div className={styles.body}>
          <div className={styles.code}><CodePanel /></div>
          <div className={styles.canvas}>
            <ReactFlowProvider><VisualCanvas /></ReactFlowProvider>
          </div>
        </div>

        <footer className={styles.footer}>
          {guard ? (
            <>
              <span className={styles.prompt}>Discard changes?</span>
              <button className={styles.cancelBtn} onClick={() => { setGuard(false); closeEditor() }}>Discard</button>
              <button className={styles.saveBtn} onClick={() => setGuard(false)}>Keep editing</button>
            </>
          ) : (
            <>
              <button className={styles.cancelBtn} onClick={cancel}>Cancel</button>
              <button className={styles.saveBtn} onClick={save}>Copy &amp; Save</button>
            </>
          )}
        </footer>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write EditorModal.module.css**

```css
.backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 9999998; display: flex; align-items: center; justify-content: center; }
.modal    { background: white; border-radius: 12px; width: 92vw; height: 88vh; max-width: 1400px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.35); }
.header   { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-bottom: 1px solid #dee2e6; background: #f8f9fa; flex-shrink: 0; }
.tag      { font-size: 11px; font-weight: 700; background: #e7f5ff; color: #5c7cfa; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; }
.title    { font-size: 15px; font-weight: 700; color: #212529; flex: 1; }
.close    { background: none; border: none; font-size: 22px; color: #868e96; cursor: pointer; }
.close:hover { color: #212529; }
.body     { flex: 1; display: flex; min-height: 0; }
.code     { flex: 1; min-height: 0; }
.canvas   { flex: 2; min-height: 0; }
.footer   { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding: 12px 18px; border-top: 1px solid #dee2e6; background: #f8f9fa; flex-shrink: 0; }
.prompt   { font-size: 13px; color: #495057; margin-right: 8px; }
.cancelBtn { padding: 7px 18px; border: 1px solid #dee2e6; background: white; border-radius: 6px; font-size: 13px; cursor: pointer; }
.cancelBtn:hover { background: #f1f3f5; }
.saveBtn  { padding: 7px 18px; background: #5c7cfa; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
.saveBtn:hover { background: #4263eb; }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/EditorModal/EditorModal.tsx src/components/EditorModal/EditorModal.module.css
git commit -m "feat: editor modal with dirty guard, keyboard shortcuts, and save flow"
```

---

## Task 18: App Root, Content Script, Background

**Files:** `src/components/App.tsx`, `src/entrypoints/content.ts`, `src/entrypoints/background.ts`

- [ ] **Step 1: Write src/components/App.tsx**

```tsx
import { useEditorStore } from '../store/editor'
import { EditorModal } from './EditorModal/EditorModal'
import { Toast } from './Toast/Toast'

export default function App() {
  const isOpen = useEditorStore(s => s.isOpen)
  return <>{isOpen && <EditorModal />}<Toast /></>
}
```

- [ ] **Step 2: Write src/entrypoints/content.ts**

```typescript
import { defineContentScript, createShadowRootUi } from 'wxt/client'
import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import { startDetector } from '../lib/detector'
import { detectDiagramType } from '../lib/diagramType'
import { useEditorStore } from '../store/editor'
import { TriggerBadge } from '../components/TriggerBadge/TriggerBadge'
import App from '../components/App'

export default defineContentScript({
  matches: ['*://*.feishu.cn/*', '*://*.larksuite.com/*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'feishu-mermaid-editor',
      position: 'overlay',
      zIndex: 9999998,
      onMount(container) {
        const root = createRoot(container)
        root.render(createElement(App))
        return root
      },
      onRemove(root) { root?.unmount() },
    })
    ui.mount()

    const stop = startDetector((block) => {
      const diagramType = detectDiagramType(block.code)
      const el = block.element as HTMLElement
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative'

      const wrap = document.createElement('div')
      wrap.setAttribute('data-mermaid-badge', block.id)
      Object.assign(wrap.style, { position: 'absolute', top: '8px', right: '8px', zIndex: '9999', display: 'none' })

      createRoot(wrap).render(createElement(TriggerBadge, {
        onEdit: () => useEditorStore.getState().openEditor(block.code, diagramType, block.id),
      }))

      el.appendChild(wrap)
      el.addEventListener('mouseenter', () => { wrap.style.display = 'block' })
      el.addEventListener('mouseleave', () => { wrap.style.display = 'none' })
      wrap.addEventListener('mouseenter', () => { wrap.style.display = 'block' })
      wrap.addEventListener('mouseleave', () => { wrap.style.display = 'none' })
    })

    ctx.onInvalidated(stop)
  },
})
```

- [ ] **Step 3: Write src/entrypoints/background.ts**

```typescript
import { defineBackground } from 'wxt/sandbox'

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    console.log('Feishu Mermaid Visual Editor installed')
  })
})
```

- [ ] **Step 4: Full type-check**

```bash
npx tsc --noEmit
```

Expected: no errors in our own files.

- [ ] **Step 5: Commit**

```bash
git add src/components/App.tsx src/entrypoints/content.ts src/entrypoints/background.ts
git commit -m "feat: content script, background, and App root"
```

---

## Task 19: Build Verification + Manual Smoke Test

- [ ] **Step 1: Run all tests**

```bash
npx vitest run --reporter=verbose
```

Expected: all tests PASS, zero failures.

- [ ] **Step 2: Build the extension**

```bash
npm run build
```

Expected: `.output/chrome-mv3/` created with no errors. Verify:

```bash
ls .output/chrome-mv3/
```

Expected: `manifest.json` present alongside `background.js` and `content-scripts/` directory.

- [ ] **Step 3: Load in Chrome**

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `.output/chrome-mv3/`
4. Extension loads with no errors in the extensions panel

- [ ] **Step 4: Manual smoke test on Feishu**

Open a Feishu document containing a Mermaid code block and verify each of the following:

1. Hover over the diagram → "✏️ Edit visually" badge appears top-right of the block
2. Move mouse away → badge hides
3. Click the badge → full-screen modal opens
4. Code panel shows the original Mermaid source
5. Visual canvas renders nodes and edges for the diagram
6. Drag a node in the canvas → code panel updates within 200ms
7. Edit the code panel → canvas re-renders within 500ms
8. Edit code panel with invalid Mermaid → canvas does not crash, red border appears on the code panel
9. Press `Escape` with unsaved changes → "Discard changes?" guard appears
10. Press `Escape` on the dirty guard → modal stays open
11. Click Discard → modal closes
12. Re-open and press `Cmd/Ctrl+S` → clipboard receives the Mermaid code
13. Original diagram block pulses with a blue outline for ~2s
14. Toast appears at top of page and auto-dismisses after 4s
15. Repeat with sequenceDiagram, classDiagram, erDiagram, and gantt diagrams — each renders correctly

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Feishu Mermaid Visual Editor Chrome extension"
```

---

## Spec Coverage

| Spec requirement | Task |
| --- | --- |
| Detect Mermaid blocks on all feishu.cn pages | Tasks 5, 18 |
| Corner badge on hover | Tasks 16, 18 |
| Full-screen Shadow DOM modal | Tasks 17, 18 |
| Side-by-side layout (code 1/3, visual 2/3) | Task 17 (CSS) |
| CodeMirror 6 code panel | Task 15 |
| ReactFlow visual canvas | Task 14 |
| All 5 diagram types (flowchart, sequence, class, ER, Gantt) | Tasks 6–10 |
| Custom node-edge canvas per type | Task 13 |
| Bidirectional sync (code ↔ visual) | Tasks 14, 15 |
| Toolbar (zoom, fit, add node) | Task 14 |
| Dirty state guard on cancel | Task 17 |
| Keyboard shortcuts (Esc, Cmd+S) | Task 17 |
| Clipboard copy on save | Task 17 |
| Block highlight pulse after save | Tasks 12, 17 |
| Auto-dismiss toast | Task 16 |
| WXT + React + Manifest V3 scaffold | Task 1 |
