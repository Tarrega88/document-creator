import { useDroppable } from '@dnd-kit/core'
import type { CSSProperties } from 'react'
import { useDocument } from '../state/documentStore'
import type { DropData } from '../dnd/dragTypes'
import { SectionList } from './SectionView'

export function Canvas() {
  const { state, dispatch } = useDocument()
  const data: DropData = { kind: 'canvas-root' }
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-root', data })

  const pageStyle = {
    ...state.globalStyles,
    '--sheet-height': `${state.sheetHeight}mm`,
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
