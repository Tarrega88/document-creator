import { useDocument } from '../state/documentStore'
import { exportJson, importJson } from '../utils/fileIo'

export function Toolbar() {
  const { state, dispatch } = useDocument()

  const onImport = async () => {
    try {
      const file = await importJson()
      dispatch({
        type: 'LOAD',
        sections: file.sections,
        templates: file.templates,
        globalStyles: file.globalStyles,
        sheetHeight: file.sheetHeight,
        marginHeight: file.marginHeight,
      })
    } catch (err) {
      // User cancelled or gave an invalid file — surface it without crashing.
      if (err instanceof Error && err.message !== 'No file selected') {
        alert(`Could not import: ${err.message}`)
      }
    }
  }

  return (
    <header className="toolbar">
      <strong className="brand">Document Creator</strong>
      <div className="toolbar-actions">
        <button type="button" className="btn" onClick={onImport}>
          Import JSON
        </button>
        <button type="button" className="btn" onClick={() => exportJson(state)}>
          Export JSON
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            if (state.sections.length && confirm('Clear the current document?')) {
              dispatch({ type: 'CLEAR' })
            }
          }}
        >
          Clear
        </button>
        <button type="button" className="btn primary" onClick={() => window.print()}>
          Export PDF
        </button>
      </div>
    </header>
  )
}
