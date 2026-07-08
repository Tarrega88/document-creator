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
  /** Id of the folder this template lives in, or null for the root list. */
  folderId: string | null
}

export interface TemplateFolder {
  id: string
  name: string
}

/** What the user currently has selected: either a section on the canvas or a
 *  section inside a template. */
export type Selection =
  | { kind: 'section'; id: string }
  | { kind: 'template-section'; templateId: string; sectionId: string }

export interface DocumentState {
  sections: Section[]
  templates: Template[]
  folders: TemplateFolder[]
  selected: Selection | null
  globalStyles: CSSProperties
  sheetHeight: number
  marginHeight: number
}

/** Shape of the JSON that gets exported / imported. Documents hold only
 *  content; `templates`/`folders` are optional and only read from older files
 *  (the template library is now global, persisted separately). */
export interface DocumentFile {
  version: 1
  sections: Section[]
  templates?: Template[]
  folders?: TemplateFolder[]
  globalStyles: CSSProperties
  sheetHeight: number
  marginHeight: number
}
