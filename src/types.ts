import type { CSSProperties } from 'react'

export type SectionType =
  | 'text'
  | 'heading'
  | 'subheader'
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
  section: Section
}

export interface DocumentState {
  sections: Section[]
  templates: Template[]
  selectedId: string | null
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
