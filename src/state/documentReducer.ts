import type { CSSProperties } from 'react'
import type {
  DocumentState,
  Section,
  SectionType,
  Selection,
  Template,
  TemplateFolder,
} from '../types'
import {
  createSection,
  DEFAULT_GLOBAL_STYLES,
  DEFAULT_MARGIN_HEIGHT,
  DEFAULT_SHEET_HEIGHT,
} from '../data/palette'
import { uid } from '../utils/id'

export type Action =
  | { type: 'ADD_SECTION'; sectionType: SectionType; parentId?: string; index?: number }
  | { type: 'ADD_SECTION_OBJECT'; section: Section; parentId?: string; index?: number }
  | { type: 'MOVE_SECTION'; id: string; parentId?: string; index: number }
  | { type: 'UPDATE_SECTION'; id: string; patch: Partial<Section> }
  | { type: 'UPDATE_STYLE'; id: string; style: CSSProperties }
  | { type: 'DELETE_SECTION'; id: string }
  | { type: 'SELECT'; selection: Selection | null }
  | { type: 'ADD_TEMPLATE'; sections: Section[]; name?: string; folderId?: string | null }
  | { type: 'ADD_SECTION_TO_TEMPLATE'; templateId: string; section: Section }
  | { type: 'MOVE_TEMPLATE_TO_FOLDER'; templateId: string; folderId: string | null }
  | { type: 'ADD_FOLDER'; name?: string }
  | { type: 'RENAME_FOLDER'; id: string; name: string }
  | { type: 'DELETE_FOLDER'; id: string }
  | { type: 'MOVE_FOLDER'; id: string; index: number }
  | { type: 'REMOVE_TEMPLATE_SECTION'; templateId: string; sectionId: string }
  | { type: 'MOVE_TEMPLATE_SECTION'; templateId: string; sectionId: string; index: number }
  | { type: 'APPLY_STYLE_TO_TEMPLATE'; id: string; sectionId: string; style: CSSProperties }
  | { type: 'INSTANTIATE_TEMPLATE'; id: string }
  | { type: 'RENAME_TEMPLATE'; id: string; name: string }
  | { type: 'DELETE_TEMPLATE'; id: string }
  | { type: 'UPDATE_GLOBAL_STYLE'; style: CSSProperties }
  | { type: 'UPDATE_SHEET_HEIGHT'; height: number }
  | { type: 'UPDATE_MARGIN_HEIGHT'; height: number }
  | {
      type: 'LOAD'
      sections: Section[]
      importedTemplates?: Template[]
      importedFolders?: TemplateFolder[]
      globalStyles: CSSProperties
      sheetHeight: number
      marginHeight: number
    }
  | { type: 'CLEAR' }

export const initialState: DocumentState = {
  sections: [],
  templates: [],
  folders: [],
  selected: null,
  globalStyles: DEFAULT_GLOBAL_STYLES,
  sheetHeight: DEFAULT_SHEET_HEIGHT,
  marginHeight: DEFAULT_MARGIN_HEIGHT,
}

/** Return a deep clone with brand-new ids (used for templates / instancing). */
function cloneWithNewIds(section: Section): Section {
  return {
    ...section,
    id: uid(),
    styles: { ...section.styles },
    children: section.children.map(cloneWithNewIds),
  }
}

/** Clone a section for storage in a template: keep the type and styles but
 *  drop content/src, since templates are style presets, not content. */
function toTemplateSection(section: Section): Section {
  return {
    ...section,
    id: uid(),
    content: '',
    src: '',
    styles: { ...section.styles },
    children: section.children.map(toTemplateSection),
  }
}

/** Clone a template section for placement on the canvas: keep the template's
 *  styles/structure but fill in the type's default placeholder content so the
 *  instantiated sections are visible and editable. */
function withDefaultContent(section: Section): Section {
  const fresh = createSection(section.type)
  return {
    ...section,
    id: uid(),
    content: fresh.content,
    src: fresh.src,
    styles: { ...section.styles },
    children: section.children.map(withDefaultContent),
  }
}

/** Recursively apply `fn` to the section matching `id`, rebuilding the tree. */
function mapSection(
  sections: Section[],
  id: string,
  fn: (s: Section) => Section,
): Section[] {
  return sections.map((s) => {
    if (s.id === id) return fn(s)
    if (s.children.length) return { ...s, children: mapSection(s.children, id, fn) }
    return s
  })
}

/** Recursively remove the section matching `id`. */
function removeSection(sections: Section[], id: string): Section[] {
  return sections
    .filter((s) => s.id !== id)
    .map((s) =>
      s.children.length ? { ...s, children: removeSection(s.children, id) } : s,
    )
}

/** Insert `section` into a list at `index` (default end). `parentId` targets a
 *  container's children, otherwise the top-level list. */
function insertAt(
  sections: Section[],
  section: Section,
  parentId: string | undefined,
  index: number | undefined,
): Section[] {
  if (!parentId) {
    const copy = [...sections]
    copy.splice(index ?? copy.length, 0, section)
    return copy
  }
  return mapSection(sections, parentId, (parent) => {
    const kids = [...parent.children]
    kids.splice(index ?? kids.length, 0, section)
    return { ...parent, children: kids }
  })
}

/** Find a section's parent list and index within it. */
export function locateSection(
  sections: Section[],
  id: string,
): { parentId: string | null; index: number } | null {
  const top = sections.findIndex((s) => s.id === id)
  if (top !== -1) return { parentId: null, index: top }
  for (const s of sections) {
    if (s.children.length) {
      const deeper = locateSection(s.children, id)
      if (deeper) return deeper.parentId ? deeper : { parentId: s.id, index: deeper.index }
    }
  }
  return null
}

/** True if `id` is `node` itself or one of its descendants. */
export function containsId(node: Section, id: string): boolean {
  if (node.id === id) return true
  return node.children.some((c) => containsId(c, id))
}

export function reducer(state: DocumentState, action: Action): DocumentState {
  switch (action.type) {
    case 'ADD_SECTION': {
      const section = createSection(action.sectionType)
      return {
        ...state,
        sections: insertAt(state.sections, section, action.parentId, action.index),
        selected: { kind: 'section', id: section.id },
      }
    }
    case 'ADD_SECTION_OBJECT': {
      const section = cloneWithNewIds(action.section)
      return {
        ...state,
        sections: insertAt(state.sections, section, action.parentId, action.index),
        selected: { kind: 'section', id: section.id },
      }
    }
    case 'MOVE_SECTION': {
      const moving = findSection(state.sections, action.id)
      if (!moving) return state
      // Can't drop a section into itself or one of its descendants.
      if (action.parentId && containsId(moving, action.parentId)) return state
      const from = locateSection(state.sections, action.id)
      let index = action.index
      if (from && from.parentId === (action.parentId ?? null) && from.index < index) {
        index -= 1
      }
      const without = removeSection(state.sections, action.id)
      return {
        ...state,
        sections: insertAt(without, moving, action.parentId, index),
        selected: { kind: 'section', id: action.id },
      }
    }
    case 'UPDATE_STYLE':
      return {
        ...state,
        sections: mapSection(state.sections, action.id, (s) => ({
          ...s,
          styles: { ...s.styles, ...action.style },
        })),
      }
    case 'UPDATE_SECTION':
      return {
        ...state,
        sections: mapSection(state.sections, action.id, (s) => ({
          ...s,
          ...action.patch,
        })),
      }
    case 'DELETE_SECTION':
      return {
        ...state,
        sections: removeSection(state.sections, action.id),
        selected:
          state.selected?.kind === 'section' && state.selected.id === action.id
            ? null
            : state.selected,
      }
    case 'SELECT':
      return { ...state, selected: action.selection }
    case 'ADD_TEMPLATE': {
      const sections = action.sections.map(toTemplateSection)
      const template: Template = {
        id: uid(),
        name: action.name ?? `${action.sections[0]?.type ?? 'empty'} template`,
        sections,
        folderId: action.folderId ?? null,
      }
      return { ...state, templates: [...state.templates, template] }
    }
    case 'ADD_SECTION_TO_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map((t) =>
          t.id === action.templateId
            ? { ...t, sections: [...t.sections, toTemplateSection(action.section)] }
            : t,
        ),
      }
    case 'REMOVE_TEMPLATE_SECTION': {
      const templates = state.templates.flatMap((t) => {
        if (t.id !== action.templateId) return [t]
        const sections = t.sections.filter((s) => s.id !== action.sectionId)
        // Drop the whole template once its last section is removed.
        return sections.length ? [{ ...t, sections }] : []
      })
      const cleared =
        state.selected?.kind === 'template-section' &&
        state.selected.templateId === action.templateId &&
        state.selected.sectionId === action.sectionId
      return { ...state, templates, selected: cleared ? null : state.selected }
    }
    case 'MOVE_TEMPLATE_SECTION':
      return {
        ...state,
        templates: state.templates.map((t) => {
          if (t.id !== action.templateId) return t
          const from = t.sections.findIndex((s) => s.id === action.sectionId)
          if (from === -1) return t
          const section = t.sections[from]
          const without = t.sections.filter((s) => s.id !== action.sectionId)
          const index = from < action.index ? action.index - 1 : action.index
          without.splice(index, 0, section)
          return { ...t, sections: without }
        }),
      }
    case 'APPLY_STYLE_TO_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map((t) =>
          t.id === action.id
            ? {
                ...t,
                sections: t.sections.map((s) =>
                  s.id === action.sectionId
                    ? { ...s, styles: { ...s.styles, ...action.style } }
                    : s,
                ),
              }
            : t,
        ),
      }
    case 'INSTANTIATE_TEMPLATE': {
      const template = state.templates.find((t) => t.id === action.id)
      if (!template) return state
      const sections = template.sections.map(withDefaultContent)
      const last = sections[sections.length - 1]
      return {
        ...state,
        sections: [...state.sections, ...sections],
        selected: last ? { kind: 'section', id: last.id } : state.selected,
      }
    }
    case 'RENAME_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map((t) =>
          t.id === action.id ? { ...t, name: action.name } : t,
        ),
      }
    case 'DELETE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter((t) => t.id !== action.id),
        selected:
          state.selected?.kind === 'template-section' &&
          state.selected.templateId === action.id
            ? null
            : state.selected,
      }
    case 'MOVE_TEMPLATE_TO_FOLDER':
      return {
        ...state,
        templates: state.templates.map((t) =>
          t.id === action.templateId ? { ...t, folderId: action.folderId } : t,
        ),
      }
    case 'ADD_FOLDER': {
      const folder: TemplateFolder = { id: uid(), name: action.name ?? 'New folder' }
      return { ...state, folders: [...state.folders, folder] }
    }
    case 'RENAME_FOLDER':
      return {
        ...state,
        folders: state.folders.map((f) =>
          f.id === action.id ? { ...f, name: action.name } : f,
        ),
      }
    case 'DELETE_FOLDER':
      return {
        ...state,
        folders: state.folders.filter((f) => f.id !== action.id),
        // Templates in a deleted folder fall back to the root list.
        templates: state.templates.map((t) =>
          t.folderId === action.id ? { ...t, folderId: null } : t,
        ),
      }
    case 'MOVE_FOLDER': {
      const from = state.folders.findIndex((f) => f.id === action.id)
      if (from === -1) return state
      const folder = state.folders[from]
      const without = state.folders.filter((f) => f.id !== action.id)
      const index = from < action.index ? action.index - 1 : action.index
      without.splice(index, 0, folder)
      return { ...state, folders: without }
    }
    case 'UPDATE_GLOBAL_STYLE':
      return { ...state, globalStyles: { ...state.globalStyles, ...action.style } }
    case 'UPDATE_SHEET_HEIGHT':
      return { ...state, sheetHeight: action.height }
    case 'UPDATE_MARGIN_HEIGHT':
      return { ...state, marginHeight: action.height }
    case 'LOAD': {
      // Templates + folders are a global library, not part of a document. Keep
      // the current library, but merge in any items from an imported file we
      // don't already have (migration for documents saved before templates
      // became global).
      const existingFolderIds = new Set(state.folders.map((f) => f.id))
      const folders = [
        ...state.folders,
        ...(action.importedFolders ?? []).filter((f) => !existingFolderIds.has(f.id)),
      ]
      const folderIds = new Set(folders.map((f) => f.id))
      const existingTemplateIds = new Set(state.templates.map((t) => t.id))
      const templates = [
        ...state.templates,
        ...(action.importedTemplates ?? [])
          .filter((t) => !existingTemplateIds.has(t.id))
          .map((t) => ({
            ...t,
            folderId: t.folderId && folderIds.has(t.folderId) ? t.folderId : null,
          })),
      ]
      return {
        sections: action.sections,
        templates,
        folders,
        globalStyles: action.globalStyles,
        sheetHeight: action.sheetHeight,
        marginHeight: action.marginHeight,
        selected: null,
      }
    }
    case 'CLEAR':
      return {
        ...initialState,
        templates: state.templates,
        folders: state.folders,
        globalStyles: state.globalStyles,
        sheetHeight: state.sheetHeight,
        marginHeight: state.marginHeight,
      }
    default:
      return state
  }
}

/** Find a section anywhere in the tree by id. */
export function findSection(sections: Section[], id: string | null): Section | null {
  if (!id) return null
  for (const s of sections) {
    if (s.id === id) return s
    const found = findSection(s.children, id)
    if (found) return found
  }
  return null
}
