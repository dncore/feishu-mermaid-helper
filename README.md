# Feishu Mermaid Visual Editor

A Chrome extension that detects Mermaid diagram blocks on Feishu (Lark) pages and lets you edit them visually with a drag-and-drop canvas.

## Features

- Detects Mermaid diagrams on any `feishu.cn` or `larksuite.com` page (Docs, Wiki, messages)
- Hover over a diagram to reveal the **✏️ Edit visually** badge
- Full-screen editor with side-by-side code panel (CodeMirror 6) and visual canvas (ReactFlow)
- Bidirectional sync — edit code or drag nodes, both views stay in sync
- Supports **flowchart**, **sequenceDiagram**, **classDiagram**, **erDiagram**, and **gantt**
- Save by copying updated Mermaid code to clipboard, then paste back into the Feishu block

## Usage

1. Load the unpacked extension in Chrome (`chrome://extensions` → **Load unpacked** → select the `.output/chrome-mv3/` folder)
2. Open any Feishu document containing a Mermaid code block
3. Hover over the diagram — an **✏️ Edit visually** button appears in the top-right corner
4. Click it to open the visual editor
5. Edit on the canvas or in the code panel
6. Click **Copy & Save** (`Cmd/Ctrl+S`) — the code is copied to your clipboard
7. Paste it back into the Feishu code block

## Development

```bash
npm install
npm run dev       # hot-reload dev build
npm run build     # production build → .output/chrome-mv3/
npm test          # run unit tests (vitest)
npm run type-check
```

Requires **Node.js ≥ 22.12.0** (WXT 0.20 uses rolldown which requires it).

## Stack

| Package | Purpose |
| --- | --- |
| [WXT](https://wxt.dev) 0.20 | Chrome MV3 extension framework, Shadow DOM UI injection |
| React 18 + ReactFlow 12 | Visual drag-drop canvas |
| CodeMirror 6 | Code editor with Mermaid syntax highlighting |
| Zustand 5 | Shared editor state |
| Vitest | Unit tests |

## Architecture

The extension injects a single Shadow DOM host into every Feishu page. The main React tree (editor modal + toast) lives inside it, fully isolated from Feishu's CSS. Each detected Mermaid block gets its own micro Shadow DOM for the trigger badge.

```
content script
├── Shadow DOM host  ← EditorModal + Toast (ReactFlow CSS injected here)
└── per-block Shadow DOM  ← TriggerBadge (style-isolated)

src/
├── entrypoints/       content.ts, background.ts
├── components/        EditorModal, TriggerBadge, Toast
├── lib/
│   ├── detector.ts    MutationObserver-based block detection
│   ├── parser/        code → nodes/edges (per diagram type)
│   └── generator/     nodes/edges → code (per diagram type)
└── store/             Zustand editor store
```

## Limitations

- Save is clipboard-only — no direct Feishu document API write
- Supports 5 diagram types (flowchart, sequence, class, ER, gantt); others are not editable
- Chrome only (MV3); Firefox/Safari not supported
