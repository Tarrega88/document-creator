import type { DocumentFile, DocumentState } from '../types'
import {
  DEFAULT_GLOBAL_STYLES,
  DEFAULT_MARGIN_HEIGHT,
  DEFAULT_SHEET_HEIGHT,
} from '../data/palette'

/** Serialize the current document + templates to a downloadable JSON file. */
export function exportJson(state: DocumentState): void {
  const file: DocumentFile = {
    version: 1,
    sections: state.sections,
    templates: state.templates,
    globalStyles: state.globalStyles,
    sheetHeight: state.sheetHeight,
    marginHeight: state.marginHeight,
  }
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'document.json'
  a.click()
  URL.revokeObjectURL(url)
}

/** Read a JSON file chosen by the user and return the parsed document. */
export function importJson(): Promise<DocumentFile> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return reject(new Error('No file selected'))
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result)) as DocumentFile
          if (!Array.isArray(data.sections)) throw new Error('Invalid document file')
          resolve({
            version: 1,
            sections: data.sections,
            templates: Array.isArray(data.templates) ? data.templates : [],
            globalStyles: data.globalStyles ?? DEFAULT_GLOBAL_STYLES,
            sheetHeight:
              typeof data.sheetHeight === 'number' ? data.sheetHeight : DEFAULT_SHEET_HEIGHT,
            marginHeight:
              typeof data.marginHeight === 'number' ? data.marginHeight : DEFAULT_MARGIN_HEIGHT,
          })
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Failed to parse file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    }
    input.click()
  })
}
