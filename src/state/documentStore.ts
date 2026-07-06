import { createContext, useContext } from 'react'
import type { DocumentState } from '../types'
import type { Action } from './documentReducer'

export interface Store {
  state: DocumentState
  dispatch: React.Dispatch<Action>
}

export const DocumentContext = createContext<Store | null>(null)

export function useDocument(): Store {
  const ctx = useContext(DocumentContext)
  if (!ctx) throw new Error('useDocument must be used within a DocumentProvider')
  return ctx
}
