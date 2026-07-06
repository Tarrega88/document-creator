import type { CSSProperties } from 'react'
import { useDocument } from '../state/documentStore'
import { findSection } from '../state/documentReducer'
import type { Section } from '../types'

const FONT_FAMILIES = [
  { label: 'Default (sans-serif)', value: '' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Serif (Georgia)', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Monospace', value: 'ui-monospace, Consolas, monospace' },
  { label: 'System UI', value: 'system-ui, "Segoe UI", Roboto, sans-serif' },
]

/** Parse a px string like "16px" into a number. */
function px(value: CSSProperties[keyof CSSProperties]): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseInt(value.replace('px', ''), 10) || 0
  return 0
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}

export function Inspector() {
  const { state, dispatch } = useDocument()
  const section = findSection(state.sections, state.selectedId)

  if (!section) {
    return (
      <aside className="inspector">
        <div className="inspector-title">Inspector</div>
        <p className="hint">Select a section to edit its content and styles.</p>
      </aside>
    )
  }

  const s = section.styles
  const setStyle = (style: CSSProperties) =>
    dispatch({ type: 'UPDATE_STYLE', id: section.id, style })
  const setContent = (content: string) =>
    dispatch({ type: 'UPDATE_SECTION', id: section.id, patch: { content } })

  const toggle = (
    prop: keyof CSSProperties,
    onValue: string | number,
    offValue: string | number,
    active: boolean,
  ) => setStyle({ [prop]: active ? offValue : onValue } as CSSProperties)

  return (
    <aside className="inspector">
      <div className="inspector-title">Inspector · {section.type}</div>

      {section.type === 'spacer' && (
        <Field label={`Height (${px(s.height) || 40}px)`}>
          <input
            type="range"
            min={0}
            max={600}
            value={px(s.height) || 40}
            onChange={(e) => setStyle({ height: `${e.target.value}px` })}
          />
        </Field>
      )}

      {(section.type === 'heading' ||
        section.type === 'subheader' ||
        section.type === 'text') && (
        <Field label="Content">
          <textarea
            className="input"
            rows={3}
            value={section.content}
            onChange={(e) => setContent(e.target.value)}
          />
        </Field>
      )}

      {section.type === 'image' && (
        <>
          <Field label="Image URL">
            <input
              className="input"
              type="text"
              placeholder="https://…"
              value={section.src}
              onChange={(e) =>
                dispatch({
                  type: 'UPDATE_SECTION',
                  id: section.id,
                  patch: { src: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Upload">
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () =>
                  dispatch({
                    type: 'UPDATE_SECTION',
                    id: section.id,
                    patch: { src: String(reader.result) },
                  })
                reader.readAsDataURL(file)
              }}
            />
          </Field>
        </>
      )}

      {section.type !== 'divider' &&
        section.type !== 'image' &&
        section.type !== 'spacer' && (
        <>
          <Field label="Font size (px)">
            <input
              className="input"
              type="number"
              min={8}
              value={px(s.fontSize) || 16}
              onChange={(e) => setStyle({ fontSize: `${e.target.value}px` })}
            />
          </Field>

          <Field label="Font family">
            <select
              className="input"
              value={(s.fontFamily as string) ?? ''}
              onChange={(e) => setStyle({ fontFamily: e.target.value || undefined })}
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.label} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="btn-row">
            <button
              type="button"
              className={`toggle ${s.fontWeight === 700 || s.fontWeight === 'bold' ? 'on' : ''}`}
              onClick={() =>
                toggle('fontWeight', 700, 'normal', s.fontWeight === 700 || s.fontWeight === 'bold')
              }
              style={{ fontWeight: 700 }}
            >
              B
            </button>
            <button
              type="button"
              className={`toggle ${s.fontStyle === 'italic' ? 'on' : ''}`}
              onClick={() => toggle('fontStyle', 'italic', 'normal', s.fontStyle === 'italic')}
              style={{ fontStyle: 'italic' }}
            >
              I
            </button>
            <button
              type="button"
              className={`toggle ${s.textDecoration === 'underline' ? 'on' : ''}`}
              onClick={() =>
                toggle('textDecoration', 'underline', 'none', s.textDecoration === 'underline')
              }
              style={{ textDecoration: 'underline' }}
            >
              U
            </button>
          </div>

          <Field label="Text align">
            <select
              className="input"
              value={(s.textAlign as string) ?? 'left'}
              onChange={(e) =>
                setStyle({ textAlign: e.target.value as CSSProperties['textAlign'] })
              }
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
          </Field>

          <Field label="Text color">
            <input
              className="input color"
              type="color"
              value={(s.color as string) ?? '#000000'}
              onChange={(e) => setStyle({ color: e.target.value })}
            />
          </Field>
        </>
      )}

      {section.type !== 'spacer' && (
        <>
          <Field label="Background color">
            <input
              className="input color"
              type="color"
              value={(s.backgroundColor as string) ?? '#ffffff'}
              onChange={(e) => setStyle({ backgroundColor: e.target.value })}
            />
          </Field>

          <Field label="Padding (px)">
            <input
              className="input"
              type="number"
              min={0}
              value={px(s.padding)}
              onChange={(e) => setStyle({ padding: `${e.target.value}px` })}
            />
          </Field>

          <Field label="Margin (px)">
            <input
              className="input"
              type="number"
              min={0}
              value={px(s.margin)}
              onChange={(e) => setStyle({ margin: `${e.target.value}px` })}
            />
          </Field>
        </>
      )}

      <div className="inspector-actions">
        <button
          type="button"
          className="btn danger"
          onClick={() => dispatch({ type: 'DELETE_SECTION', id: section.id })}
        >
          Delete section
        </button>
      </div>

      <ContainerNote section={section} />
    </aside>
  )
}

function ContainerNote({ section }: { section: Section }) {
  if (section.type !== 'container') return null
  return <p className="hint">Drop sections onto this container to nest them inside.</p>
}
