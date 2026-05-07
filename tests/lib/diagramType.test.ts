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
