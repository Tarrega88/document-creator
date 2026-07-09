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
  const sel = state.selected

  let section: Section | null = null
  let isTemplate = false
  let templateId = ''
  if (sel?.kind === 'section') {
    section = findSection(state.sections, sel.id)
  } else if (sel?.kind === 'template-section') {
    const template = state.templates.find((t) => t.id === sel.templateId)
    section = template?.sections.find((s) => s.id === sel.sectionId) ?? null
    isTemplate = true
    templateId = sel.templateId
  }

  if (!section) {
    return (
      <aside className="inspector">
        <div className="inspector-title">Inspector</div>
        <p className="hint">Select a section to edit its content and styles.</p>
      </aside>
    )
  }

  const activeSection = section
  const s = activeSection.styles
  const setStyle = (style: CSSProperties) =>
    isTemplate
      ? dispatch({
          type: 'APPLY_STYLE_TO_TEMPLATE',
          id: templateId,
          sectionId: activeSection.id,
          style,
        })
      : dispatch({ type: 'UPDATE_STYLE', id: activeSection.id, style })
  const setContent = (content: string) =>
    dispatch({ type: 'UPDATE_SECTION', id: activeSection.id, patch: { content } })
  const deleteSection = () =>
    isTemplate
      ? dispatch({
          type: 'REMOVE_TEMPLATE_SECTION',
          templateId,
          sectionId: activeSection.id,
        })
      : dispatch({ type: 'DELETE_SECTION', id: activeSection.id })

  const toggle = (
    prop: keyof CSSProperties,
    onValue: string | number,
    offValue: string | number,
    active: boolean,
  ) => setStyle({ [prop]: active ? offValue : onValue } as CSSProperties)

  return (
    <aside className="inspector">
      <div className="inspector-title">
        Inspector · {section.type}
        {isTemplate && <span className="inspector-scope"> (template)</span>}
      </div>

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

      {!isTemplate &&
        (section.type === 'heading' ||
          section.type === 'subheader' ||
          section.type === 'text' ||
          section.type === 'link') && (
          <Field label={section.type === 'link' ? 'Link text' : 'Content'}>
            <textarea
              className="input"
              rows={3}
              value={section.content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Field>
        )}

      {!isTemplate && section.type === 'link' && (
        <Field label="Link URL">
          <input
            className="input"
            type="text"
            placeholder="https://…"
            value={section.src}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_SECTION',
                id: activeSection.id,
                patch: { src: e.target.value },
              })
            }
          />
        </Field>
      )}

      {!isTemplate && section.type === 'image' && (
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
                  id: activeSection.id,
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
                    id: activeSection.id,
                    patch: { src: String(reader.result) },
                  })
                reader.readAsDataURL(file)
              }}
            />
          </Field>
        </>
      )}

      {!isTemplate && section.type === 'table' && (
        <Field label="Row height (px)">
          <input
            className="input"
            type="number"
            min={0}
            placeholder="Auto"
            value={activeSection.table?.rowHeight ?? ''}
            onChange={(e) =>
              dispatch({
                type: 'SET_TABLE_ROW_HEIGHT',
                id: activeSection.id,
                height: Number(e.target.value),
              })
            }
          />
        </Field>
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
          onClick={deleteSection}
        >
          Delete section
        </button>
      </div>

      <ContainerNote section={section} />
      <TableNote section={section} />
    </aside>
  )
}

function ContainerNote({ section }: { section: Section }) {
  if (section.type !== 'container') return null
  return <p className="hint">Drop sections onto this container to nest them inside.</p>
}

function TableNote({ section }: { section: Section }) {
  if (section.type !== 'table') return null
  return (
    <p className="hint">
      Edit headers and cells directly in the table. Use the +/✕ controls to add or remove
      columns and rows. Font and colors here apply to the whole table.
    </p>
  )
}
