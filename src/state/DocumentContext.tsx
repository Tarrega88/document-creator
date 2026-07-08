import { useEffect, useReducer, type ReactNode } from 'react'
import type { DocumentState } from '../types'
import { initialState, reducer } from './documentReducer'
import { DocumentContext } from './documentStore'
import { loadTemplateLibrary, saveTemplateLibrary } from '../utils/templateStorage'

/** Seed the document with the global template library so templates/folders are
 *  shared across every document and survive reloads. */
function createInitialState(): DocumentState {
  const { templates, folders } = loadTemplateLibrary()
  return { ...initialState, templates, folders }
}

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)

  // Persist the global template library whenever it changes.
  useEffect(() => {
    saveTemplateLibrary(state.templates, state.folders)
  }, [state.templates, state.folders])

  return (
    <DocumentContext.Provider value={{ state, dispatch }}>
      {children}
    </DocumentContext.Provider>
  )
}
