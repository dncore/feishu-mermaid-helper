# Feishu Mermaid Visual Editor — Chrome Extension Design

**Date:** 2026-05-07  
**Status:** Approved

---

## Overview

A Chrome extension that detects Mermaid diagram blocks on any Feishu page, lets the user open a full-screen visual editor with drag-and-drop canvas editing, and copies the updated Mermaid code to the clipboard for manual pasting back into the document.

---

## Decisions

| Dimension | Choice |
| --- | --- |
| Save method | Clipboard copy + block highlight + toast guidance |
| Diagram types supported | flowchart, sequenceDiagram, classDiagram, erDiagram, gantt |
| Feishu surfaces | All pages under `feishu.cn` (Docs, Wiki, messages, etc.) |
| Visual editor model | Drag-drop node-edge canvas for all diagram types |
| Tech stack | WXT + React + Vite + Manifest V3 |
| Modal injection | Shadow DOM (style isolation from Feishu CSS) |
| Modal layout | Side by side — code panel left (1/3), visual canvas right (2/3) |
| Trigger affordance | Corner badge on hover ("Edit visually" button, top-right of diagram block) |

---

## Architecture

### Extension Entrypoints

**Content script** (`src/entrypoints/content.ts`):

- Injected into all `feishu.cn` pages
- Runs a `MutationObserver` on the full document to detect Mermaid blocks as Feishu renders them (SPA lazy rendering)
- Mounts the `TriggerBadge` and `EditorModal` React trees into a single Shadow DOM host element injected into `document.body`

**Background service worker** (`src/entrypoints/background.ts`):

- Minimal: handles extension install event and clipboard permission prompting if needed

### Project Structure

```text
feishu-mermaid-helper/
├── src/
│   ├── entrypoints/
│   │   ├── content.ts
│   │   └── background.ts
│   ├── components/
│   │   ├── TriggerBadge/
│   │   │   └── TriggerBadge.tsx       ← hover badge injected on each Mermaid block
│   │   ├── EditorModal/
│   │   │   ├── EditorModal.tsx        ← full-screen overlay container
│   │   │   ├── CodePanel/
│   │   │   │   └── CodePanel.tsx      ← CodeMirror 6 editor, left 1/3
│   │   │   ├── VisualCanvas/
│   │   │   │   ├── VisualCanvas.tsx   ← ReactFlow canvas, right 2/3
│   │   │   │   └── Toolbar.tsx        ← zoom, fit, add node, delete
│   │   │   └── NodeTypes/
│   │   │       ├── FlowchartNodes.tsx
│   │   │       ├── SequenceNodes.tsx
│   │   │       ├── ClassNodes.tsx
│   │   │       ├── ErNodes.tsx
│   │   │       └── GanttNodes.tsx
│   │   └── SaveFeedback/
│   │       └── Toast.tsx              ← "Copied! Paste into Feishu" toast
│   ├── lib/
│   │   ├── detector.ts                ← MutationObserver + selector scanning
│   │   ├── parser/
│   │   │   ├── index.ts               ← dispatch to type-specific parser
│   │   │   ├── flowchart.ts
│   │   │   ├── sequence.ts
│   │   │   ├── class.ts
│   │   │   ├── er.ts
│   │   │   └── gantt.ts
│   │   └── generator/
│   │       ├── index.ts               ← dispatch to type-specific generator
│   │       ├── flowchart.ts
│   │       ├── sequence.ts
│   │       ├── class.ts
│   │       ├── er.ts
│   │       └── gantt.ts
│   └── store/
│       └── editor.ts                  ← Zustand store (code string + ReactFlow state)
├── wxt.config.ts
├── package.json
└── tsconfig.json
```

---

## Feature: Feishu Mermaid Detection

The `detector.ts` module uses `MutationObserver` to scan the document on every DOM change batch. It tries the following selectors in order:

1. `div.mermaid` — rendered SVG container (post-render)
2. `pre > code.language-mermaid` — raw code block (pre-render)
3. `[data-language="mermaid"]` — Feishu block attribute
4. `.code-block [class*="mermaid"]` — fallback pattern

For each detected block, the detector:

1. Extracts source Mermaid code from `textContent` or `data-content` attribute
2. Detects diagram type from the first non-empty line keyword
3. Tags the block with `data-mermaid-id="<uuid>"` for later highlight targeting
4. Injects a positioned `TriggerBadge` overlay on the block

---

## Feature: Trigger Badge

`TriggerBadge` is a React component mounted as an absolutely positioned overlay in the top-right corner of each detected Mermaid block. It:

- Appears on `mouseenter` of the diagram block, hides on `mouseleave` (unless the badge itself is hovered)
- Contains a single button: **"✏️ Edit visually"**
- On click: dispatches an event to open the `EditorModal` with the diagram's source code and type

---

## Feature: Editor Modal

Full-viewport overlay mounted in Shadow DOM. Structure:

```text
┌─────────────────────────────────────────────────────┐
│  [diagram type badge]   Mermaid Visual Editor   [×] │
├──────────────────┬──────────────────────────────────┤
│                  │                                  │
│   Code Panel     │       Visual Canvas              │
│   (CodeMirror 6) │       (ReactFlow)                │
│   1/3 width      │       2/3 width                  │
│                  │       [toolbar: zoom/fit/add/del] │
│                  │                                  │
├──────────────────┴──────────────────────────────────┤
│                          [Cancel]  [Copy & Save]    │
└─────────────────────────────────────────────────────┘
```

**Opening:** Parser runs on source code → initializes Zustand store → ReactFlow renders nodes/edges → CodeMirror shows source.

**Dirty state guard:** If changes exist and user clicks Cancel or backdrop, shows inline confirmation: "Discard changes? / Keep editing".

**Keyboard shortcuts:**

- `Escape` → Cancel (with dirty guard)
- `Cmd/Ctrl + S` → Copy & Save

---

## Feature: Visual Editor (ReactFlow Canvas)

### Node Types per Diagram

| Diagram | Node types | Edge types |
| --- | --- | --- |
| `flowchart` / `graph` | rectangle, diamond (decision), rounded (terminal), parallelogram (I/O) | directed arrow with optional label |
| `sequenceDiagram` | actor boxes (fixed horizontal row), activation bars | horizontal arrows with message labels |
| `classDiagram` | class box (name / attributes / methods compartments) | inheritance, composition, aggregation, dependency |
| `erDiagram` | entity box (field + type rows) | labeled edges with cardinality markers |
| `gantt` | task pill (label + duration bar, grouped by section) | dependency edges |

### Canvas Interactions

- **Drag node** → reposition
- **Click node** → open inline popover to edit label, type, shape
- **Drag from node handle** → draw new edge to target node
- **Click edge** → edit label or delete
- **Double-click canvas background** → add new node at cursor position
- **Toolbar:** zoom in, zoom out, fit view, add node, delete selected

### Toolbar

Floating toolbar above the canvas with buttons: Zoom In, Zoom Out, Fit View, Add Node, Delete Selected, and a read-only diagram type indicator badge.

---

## Feature: Bidirectional Sync

### Code → Visual

1. User edits CodeMirror panel
2. 400ms debounce
3. `mermaid.parse(code)` — if invalid, red border on panel, canvas unchanged
4. If valid: run type-specific parser → update Zustand store nodes/edges → ReactFlow re-renders

### Visual → Code

1. ReactFlow `onNodesChange` / `onEdgesChange` fires
2. 150ms debounce
3. Run type-specific generator → update Zustand store code string → CodeMirror re-renders

### Parser / Generator Contract

Each diagram type has a symmetric pair:

```ts
// parser/<type>.ts
export function parse(code: string): { nodes: Node[]; edges: Edge[] }

// generator/<type>.ts
export function generate(nodes: Node[], edges: Edge[]): string
```

---

## Feature: Save Flow

1. User clicks **Copy & Save**
2. `navigator.clipboard.writeText(currentCode)`
3. Modal closes
4. Content script finds original block by `data-mermaid-id`, applies a 2s highlight pulse animation
5. Toast appears at top of Feishu page: *"Mermaid code copied — paste it into the code block to update the diagram"* (auto-dismiss after 4s)

---

## Dependencies

| Package | Purpose |
| --- | --- |
| `wxt` | Extension framework (MV3, Shadow DOM UI, hot reload) |
| `react`, `react-dom` | UI framework |
| `@xyflow/react` | Drag-drop node-edge canvas (ReactFlow v12) |
| `@codemirror/state`, `@codemirror/view`, `@codemirror/lang-markdown` | CodeMirror 6 editor with Mermaid keyword highlighting |
| `mermaid` | Code parsing and AST extraction |
| `zustand` | Shared editor state store |
| `vite` | Build tooling (via WXT) |

---

## Out of Scope

- Direct Feishu document API writes (save is clipboard-only)
- Real-time collaboration
- Mermaid diagram creation from scratch (only editing existing blocks)
- Diagram types beyond the 5 listed (pie, mindmap, timeline, etc.)
- Firefox / Safari support
