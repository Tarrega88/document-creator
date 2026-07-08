import type { Template, TemplateFolder } from '../types'
import { normalizeFolders, normalizeTemplates } from './fileIo'

/** localStorage key for the global template library. Bump the suffix if the
 *  stored shape ever changes in a non-backward-compatible way. */
const STORAGE_KEY = 'doc-creator:template-library:v1'

export interface TemplateLibrary {
  templates: Template[]
  folders: TemplateFolder[]
}

/** Read the global template library from localStorage. Returns an empty
 *  library if nothing is stored or the data can't be parsed. */
export function loadTemplateLibrary(): TemplateLibrary {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { templates: [], folders: [] }
    const data = JSON.parse(raw) as { templates?: unknown; folders?: unknown }
    const folders = normalizeFolders(data.folders)
    const folderIds = new Set(folders.map((f) => f.id))
    return { templates: normalizeTemplates(data.templates, folderIds), folders }
  } catch {
    return { templates: [], folders: [] }
  }
}

/** Persist the global template library to localStorage. Best-effort: quota or
 *  availability errors are swallowed rather than crashing the editor. */
export function saveTemplateLibrary(templates: Template[], folders: TemplateFolder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ templates, folders }))
  } catch {
    // Ignore — persistence is best-effort.
  }
}
