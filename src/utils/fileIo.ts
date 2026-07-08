import type {
  DocumentFile,
  DocumentState,
  Section,
  Template,
  TemplateFolder,
} from '../types'
import {
  DEFAULT_GLOBAL_STYLES,
  DEFAULT_MARGIN_HEIGHT,
  DEFAULT_SHEET_HEIGHT,
} from '../data/palette'

/** Serialize the current document to a downloadable JSON file. Templates and
 *  folders are a global library (persisted separately), so they are not part of
 *  a document file. */
export function exportJson(state: DocumentState): void {
  const file: DocumentFile = {
    version: 1,
    sections: state.sections,
    globalStyles: state.globalStyles,
    sheetHeight: state.sheetHeight,
    marginHeight: state.marginHeight,
  }
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'document.json'
  a.click()
  URL.revokeObjectURL(url)
}

/** Normalize templates from any file version. Templates used to hold a single
 *  `section`; they now hold a `sections` array. Templates predating folders
 *  have no `folderId`, so they default to the root list. Any template pointing
 *  at a folder that no longer exists is also pushed back to the root. */
export function normalizeTemplates(raw: unknown, folderIds: Set<string>): Template[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((t) => {
      const template = t as Partial<Template> & { section?: Section }
      const sections = Array.isArray(template.sections)
        ? template.sections
        : template.section
          ? [template.section]
          : []
      if (!template.id || sections.length === 0) return null
      const folderId =
        typeof template.folderId === 'string' && folderIds.has(template.folderId)
          ? template.folderId
          : null
      return { id: template.id, name: template.name ?? 'template', sections, folderId }
    })
    .filter((t): t is Template => t !== null)
}

/** Normalize folders from any file version. Older files have no folders. */
export function normalizeFolders(raw: unknown): TemplateFolder[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((f) => {
      const folder = f as Partial<TemplateFolder>
      if (!folder.id) return null
      return { id: folder.id, name: folder.name ?? 'Folder' }
    })
    .filter((f): f is TemplateFolder => f !== null)
}

/** Read a JSON file chosen by the user and return the parsed document. */
export function importJson(): Promise<DocumentFile> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return reject(new Error('No file selected'))
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result)) as DocumentFile
          if (!Array.isArray(data.sections)) throw new Error('Invalid document file')
          const folders = normalizeFolders(data.folders)
          const folderIds = new Set(folders.map((f) => f.id))
          resolve({
            version: 1,
            sections: data.sections,
            templates: normalizeTemplates(data.templates, folderIds),
            folders,
            globalStyles: data.globalStyles ?? DEFAULT_GLOBAL_STYLES,
            sheetHeight:
              typeof data.sheetHeight === 'number' ? data.sheetHeight : DEFAULT_SHEET_HEIGHT,
            marginHeight:
              typeof data.marginHeight === 'number' ? data.marginHeight : DEFAULT_MARGIN_HEIGHT,
          })
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Failed to parse file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    }
    input.click()
  })
}
