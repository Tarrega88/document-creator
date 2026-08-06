import { useDroppable } from '@dnd-kit/core'
import type { CSSProperties } from 'react'
import { useDocument } from '../state/documentStore'
import { PAGE_SHORT_EDGE } from '../data/palette'
import type { DropData } from '../dnd/dragTypes'
import { SectionList } from './SectionView'

export function Canvas() {
  const { state, dispatch } = useDocument()
  const data: DropData = { kind: 'canvas-root' }
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-root', data })

  // In landscape the sheet is rotated: its long edge (`sheetHeight`) becomes the
  // page width and the fixed short edge becomes the page height (the page-break
  // interval). Text still flows top to bottom in both orientations.
  const isLandscape = state.orientation === 'landscape'
  const pageWidth = isLandscape ? state.sheetHeight : PAGE_SHORT_EDGE
  const pageHeight = isLandscape ? PAGE_SHORT_EDGE : state.sheetHeight

  const pageStyle = {
    ...state.globalStyles,
    '--page-width': `${pageWidth}mm`,
    '--sheet-height': `${pageHeight}mm`,
    '--page-margin': `${state.marginHeight}mm`,
  } as CSSProperties

  return (
    <main className="canvas" onClick={() => dispatch({ type: 'SELECT', selection: null })}>
      <div
        ref={setNodeRef}
        id="document-page"
        className={`page ${isOver ? 'drop-target' : ''}`}
        style={pageStyle}
      >
        {state.sections.length === 0 ? (
          <div className="page-empty">
            Drag sections from the left to start building your document.
          </div>
        ) : (
          <SectionList sections={state.sections} parentId={null} />
        )}
      </div>
    </main>
  )
}
