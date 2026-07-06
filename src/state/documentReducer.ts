import type { CSSProperties } from 'react'
import type { DocumentState, Section, SectionType, Template } from '../types'
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
  | { type: 'APPLY_STYLE'; id: string; style: CSSProperties }
  | { type: 'UPDATE_SECTION'; id: string; patch: Partial<Section> }
  | { type: 'UPDATE_STYLE'; id: string; style: CSSProperties }
  | { type: 'DELETE_SECTION'; id: string }
  | { type: 'SELECT'; id: string | null }
  | { type: 'ADD_TEMPLATE'; section: Section; name?: string }
  | { type: 'APPLY_STYLE_TO_TEMPLATE'; id: string; style: CSSProperties }
  | { type: 'INSTANTIATE_TEMPLATE'; id: string }
  | { type: 'RENAME_TEMPLATE'; id: string; name: string }
  | { type: 'DELETE_TEMPLATE'; id: string }
  | { type: 'UPDATE_GLOBAL_STYLE'; style: CSSProperties }
  | { type: 'UPDATE_SHEET_HEIGHT'; height: number }
  | { type: 'UPDATE_MARGIN_HEIGHT'; height: number }
  | {
      type: 'LOAD'
      sections: Section[]
      templates: Template[]
      globalStyles: CSSProperties
      sheetHeight: number
      marginHeight: number
    }
  | { type: 'CLEAR' }

export const initialState: DocumentState = {
  sections: [],
  templates: [],
  selectedId: null,
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
        selectedId: section.id,
      }
    }
    case 'ADD_SECTION_OBJECT': {
      const section = cloneWithNewIds(action.section)
      return {
        ...state,
        sections: insertAt(state.sections, section, action.parentId, action.index),
        selectedId: section.id,
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
        selectedId: action.id,
      }
    }
    case 'APPLY_STYLE':
      return {
        ...state,
        selectedId: action.id,
        sections: mapSection(state.sections, action.id, (s) => ({
          ...s,
          styles: { ...s.styles, ...action.style },
        })),
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
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      }
    case 'SELECT':
      return { ...state, selectedId: action.id }
    case 'ADD_TEMPLATE': {
      const template: Template = {
        id: uid(),
        name: action.name ?? `${action.section.type} template`,
        section: cloneWithNewIds(action.section),
      }
      return { ...state, templates: [...state.templates, template] }
    }
    case 'APPLY_STYLE_TO_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map((t) =>
          t.id === action.id
            ? { ...t, section: { ...t.section, styles: { ...t.section.styles, ...action.style } } }
            : t,
        ),
      }
    case 'INSTANTIATE_TEMPLATE': {
      const template = state.templates.find((t) => t.id === action.id)
      if (!template) return state
      const section = cloneWithNewIds(template.section)
      return { ...state, sections: [...state.sections, section], selectedId: section.id }
    }
    case 'RENAME_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map((t) =>
          t.id === action.id ? { ...t, name: action.name } : t,
        ),
      }
    case 'DELETE_TEMPLATE':
      return { ...state, templates: state.templates.filter((t) => t.id !== action.id) }
    case 'UPDATE_GLOBAL_STYLE':
      return { ...state, globalStyles: { ...state.globalStyles, ...action.style } }
    case 'UPDATE_SHEET_HEIGHT':
      return { ...state, sheetHeight: action.height }
    case 'UPDATE_MARGIN_HEIGHT':
      return { ...state, marginHeight: action.height }
    case 'LOAD':
      return {
        sections: action.sections,
        templates: action.templates,
        globalStyles: action.globalStyles,
        sheetHeight: action.sheetHeight,
        marginHeight: action.marginHeight,
        selectedId: null,
      }
    case 'CLEAR':
      return {
        ...initialState,
        templates: state.templates,
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
