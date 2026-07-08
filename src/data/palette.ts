import type { CSSProperties } from 'react'
import type { Section, SectionType } from '../types'
import { uid } from '../utils/id'

/** Draggable "section" building blocks shown in the sidebar. */
export interface SectionDef {
  type: SectionType
  label: string
  icon: string
}

export const SECTION_DEFS: SectionDef[] = [
  { type: 'heading', label: 'Heading', icon: 'H' },
  { type: 'subheader', label: 'Subheader', icon: 'h' },
  { type: 'text', label: 'Text', icon: '¶' },
  { type: 'image', label: 'Image', icon: '▦' },
  { type: 'divider', label: 'Divider', icon: '—' },
  { type: 'spacer', label: 'Spacer', icon: '↕' },
  { type: 'container', label: 'Container', icon: '▤' },
]

/** Document-wide style defaults applied to the page and inherited by every
 *  section unless a section overrides a given property. */
export const DEFAULT_GLOBAL_STYLES: CSSProperties = {
  fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
  fontSize: '16px',
  lineHeight: 1.5,
  color: '#1a1a1a',
}

/** Default printed sheet height in millimetres (A4). */
export const DEFAULT_SHEET_HEIGHT = 297

/** Default top/bottom page margin in millimetres (1 inch). */
export const DEFAULT_MARGIN_HEIGHT = 25.4

/** Build a fresh section with sensible defaults for its type. */
export function createSection(type: SectionType): Section {
  const base: Section = { id: uid(), type, content: '', src: '', styles: {}, children: [] }
  switch (type) {
    case 'heading':
      return { ...base, content: 'Heading', styles: { fontSize: '32px', fontWeight: 700 } }
    case 'subheader':
      return { ...base, content: 'Subheader', styles: { fontSize: '24px', fontWeight: 600 } }
    case 'text':
      return {
        ...base,
        content:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Click to edit this text.',
      }
    case 'divider':
      return { ...base }
    case 'spacer':
      return { ...base, styles: { height: '40px' } }
    case 'container':
      return { ...base, styles: { display: 'flex', gap: '16px', padding: '16px' } }
    case 'image':
    default:
      return { ...base }
  }
}
