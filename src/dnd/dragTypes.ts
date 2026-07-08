import type { SectionType } from '../types'

/** Data attached to draggable / droppable items so the drag-end handler
 *  can decide what a drop means. */
export type DragData =
  | { kind: 'palette-section'; sectionType: SectionType; label: string }
  | { kind: 'section'; id: string; isContainer: boolean }
  | { kind: 'template-section'; templateId: string; sectionId: string; label: string }

export type DropData =
  | { kind: 'canvas-root' }
  | { kind: 'section'; id: string; isContainer: boolean }
  | { kind: 'template-area' }
  | { kind: 'template'; id: string }
  | { kind: 'template-section'; templateId: string; sectionId: string }
