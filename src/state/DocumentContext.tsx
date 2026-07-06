import { useReducer, type ReactNode } from 'react'
import { initialState, reducer } from './documentReducer'
import { DocumentContext } from './documentStore'

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <DocumentContext.Provider value={{ state, dispatch }}>
      {children}
    </DocumentContext.Provider>
  )
}
