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
  | 'table'

/** Structured data for a `table` section: header labels plus a grid of string
 *  cells. `rows[r][c]` is the cell in row `r`, column `c`; every row has the
 *  same length as `columns`. */
export interface TableData {
  columns: string[]
  rows: string[][]
  /** Applied to every row (header + body) in pixels; unset means auto height. */
  rowHeight?: number
}

export interface Section {
  id: string
  type: SectionType
  content: string
  src: string
  styles: CSSProperties
  children: Section[]
  /** Present only for `table` sections. */
  table?: TableData
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
