import type { CSSProperties } from 'react'

export type SectionType =
  | 'text'
  | 'heading'
  | 'subheader'
  | 'link'
  | 'image'
  | 'divider'
  | 'spacer'
  | 'container'

export interface Section {
  id: string
  type: SectionType
  content: string
  src: string
  styles: CSSProperties
  children: Section[]
}

export interface Template {
  id: string
  name: string
  sections: Section[]
}

/** What the user currently has selected: either a section on the canvas or a
 *  section inside a template. */
export type Selection =
  | { kind: 'section'; id: string }
  | { kind: 'template-section'; templateId: string; sectionId: string }

export interface DocumentState {
  sections: Section[]
  templates: Template[]
  selected: Selection | null
  globalStyles: CSSProperties
  sheetHeight: number
  marginHeight: number
}

/** Shape of the JSON that gets exported / imported. */
export interface DocumentFile {
  version: 1
  sections: Section[]
  templates: Template[]
  globalStyles: CSSProperties
  sheetHeight: number
  marginHeight: number
}
