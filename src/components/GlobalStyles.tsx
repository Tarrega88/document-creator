import type { CSSProperties } from 'react'
import { useDocument } from '../state/documentStore'

const FONT_FAMILIES = [
  { label: 'Sans-serif', value: 'system-ui, "Segoe UI", Roboto, sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Serif (Georgia)', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Monospace', value: 'ui-monospace, Consolas, monospace' },
]

const SHEET_PRESETS = [
  { label: 'A4 (297mm)', value: 297 },
  { label: 'US Letter (279mm)', value: 279 },
  { label: 'US Legal (356mm)', value: 356 },
]

const MARGIN_PRESETS = [
  { label: '0.5 inch', value: 12.7 },
  { label: '0.75 inch', value: 19.05 },
  { label: '1 inch', value: 25.4 },
]

function px(value: CSSProperties[keyof CSSProperties]): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseInt(value.replace('px', ''), 10) || 0
  return 0
}

/** Document-wide style defaults. These cascade to every section via CSS
 *  inheritance; a style applied directly to a section overrides them. */
export function GlobalStyles() {
  const { state, dispatch } = useDocument()
  const g = state.globalStyles
  const set = (style: CSSProperties) => dispatch({ type: 'UPDATE_GLOBAL_STYLE', style })

  return (
    <>
      <p className="hint">Defaults for every section unless overridden by an applied style.</p>
      <label className="field">
        <span className="field-label">Font family</span>
        <select
          className="input"
          value={(g.fontFamily as string) ?? ''}
          onChange={(e) => set({ fontFamily: e.target.value })}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Font size (px)</span>
        <input
          className="input"
          type="number"
          min={8}
          value={px(g.fontSize) || 16}
          onChange={(e) => set({ fontSize: `${e.target.value}px` })}
        />
      </label>
      <label className="field">
        <span className="field-label">Line height</span>
        <input
          className="input"
          type="number"
          min={1}
          step={0.1}
          value={typeof g.lineHeight === 'number' ? g.lineHeight : 1.5}
          onChange={(e) => set({ lineHeight: Number(e.target.value) })}
        />
      </label>
      <label className="field">
        <span className="field-label">Text color</span>
        <input
          className="input color"
          type="color"
          value={(g.color as string) ?? '#1a1a1a'}
          onChange={(e) => set({ color: e.target.value })}
        />
      </label>
      <label className="field">
        <span className="field-label">Sheet size</span>
        <select
          className="input"
          value={SHEET_PRESETS.some((p) => p.value === state.sheetHeight) ? state.sheetHeight : ''}
          onChange={(e) =>
            e.target.value &&
            dispatch({ type: 'UPDATE_SHEET_HEIGHT', height: Number(e.target.value) })
          }
        >
          {SHEET_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
          <option value="">Custom…</option>
        </select>
      </label>
      <label className="field">
        <span className="field-label">Sheet height (mm)</span>
        <input
          className="input"
          type="number"
          min={50}
          value={state.sheetHeight}
          onChange={(e) => dispatch({ type: 'UPDATE_SHEET_HEIGHT', height: Number(e.target.value) })}
        />
      </label>
      <label className="field">
        <span className="field-label">Margin (top/bottom)</span>
        <select
          className="input"
          value={state.marginHeight}
          onChange={(e) =>
            dispatch({ type: 'UPDATE_MARGIN_HEIGHT', height: Number(e.target.value) })
          }
        >
          {MARGIN_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
    </>
  )
}
