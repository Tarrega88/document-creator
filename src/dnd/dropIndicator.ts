import { createContext, useContext } from 'react'

/** Where a dragged item would be inserted. `parentId` is null for the
 *  top-level page list, or a container id for its children. `index` is the
 *  insertion position within that list. */
export interface DropIndicator {
  parentId: string | null
  index: number
}

export const DropIndicatorContext = createContext<DropIndicator | null>(null)

export function useDropIndicator() {
  return useContext(DropIndicatorContext)
}
