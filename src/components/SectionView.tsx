import { Fragment, useRef } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useDocument } from '../state/documentStore'
import { useDropIndicator } from '../dnd/dropIndicator'
import type { DragData, DropData } from '../dnd/dragTypes'
import type { Section } from '../types'

function EditableText({
  section,
  tag,
}: {
  section: Section
  tag: 'h2' | 'h3' | 'p'
}) {
  const { dispatch } = useDocument()
  const Tag = tag
  return (
    <Tag
      className="editable"
      style={section.styles}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) =>
        dispatch({
          type: 'UPDATE_SECTION',
          id: section.id,
          patch: { content: e.currentTarget.textContent ?? '' },
        })
      }
    >
      {section.content}
    </Tag>
  )
}

/** Restrict hrefs to safe schemes to avoid javascript:/data: URI injection.
 *  Schemeless values are assumed to be https URLs. */
function safeHref(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return '#'
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return '#'
  return `https://${trimmed}`
}

/** A block-level hyperlink. Rendered as a plain (non-editable) anchor so that
 *  it becomes a clickable link annotation in the printed/exported PDF —
 *  Chromium omits link annotations for anchors inside editable content. The
 *  label text and URL are edited from the inspector. */
function LinkSection({ section }: { section: Section }) {
  return (
    <a
      className="doc-link"
      style={section.styles}
      href={safeHref(section.src)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.preventDefault()}
    >
      {section.content || 'Link'}
    </a>
  )
}

/** An image (or its placeholder) that can be resized by dragging a corner
 *  handle. Resizing sets an explicit pixel width/height on the section. */
function ImageSection({ section }: { section: Section }) {
  const { state, dispatch } = useDocument()
  const wrapRef = useRef<HTMLDivElement>(null)
  const selected =
    state.selected?.kind === 'section' && state.selected.id === section.id

  const startResize = (e: React.PointerEvent) => {
    // Don't let the resize gesture trigger selection or a section drag.
    e.preventDefault()
    e.stopPropagation()
    const el = wrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const startX = e.clientX
    const startWidth = rect.width

    const onMove = (ev: PointerEvent) => {
      const width = Math.max(20, Math.round(startWidth + (ev.clientX - startX)))
      dispatch({
        type: 'UPDATE_STYLE',
        id: section.id,
        style: { width: `${width}px`, height: 'auto' },
      })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div ref={wrapRef} className="doc-image-wrap" style={{ width: section.styles.width }}>
      {section.src ? (
        <img className="doc-image" src={section.src} alt="" style={section.styles} />
      ) : (
        <div className="image-placeholder" style={section.styles}>
          No image — select and add a URL or upload in the inspector
        </div>
      )}
      {selected && (
        <span
          className="resize-handle"
          title="Drag to resize"
          onPointerDown={startResize}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  )
}

/** An editable cell in a table section. Renders a spreadsheet-like cell that
 *  commits its text on blur. Used for both header labels and body cells. */
function TableCell({
  value,
  header,
  style,
  onCommit,
}: {
  value: string
  header: boolean
  style?: React.CSSProperties
  onCommit: (value: string) => void
}) {
  const Tag = header ? 'th' : 'td'
  return (
    <Tag
      className={header ? 'doc-table-th' : 'doc-table-td'}
      style={style}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onCommit(e.currentTarget.textContent ?? '')}
    >
      {value}
    </Tag>
  )
}

/** A configurable, spreadsheet-like table. Columns and rows are added/removed
 *  inline; headers and cells are edited in place. Structure controls appear
 *  when the section is selected. */
function TableSection({ section }: { section: Section }) {
  const { state, dispatch } = useDocument()
  const table = section.table ?? { columns: [], rows: [] }
  const selected = state.selected?.kind === 'section' && state.selected.id === section.id
  const align = section.styles.textAlign
  const rowHeight = table.rowHeight
  const headerStyle = rowHeight ? { height: `${rowHeight}px` } : undefined
  const bodyStyle =
    align || rowHeight
      ? { textAlign: align, height: rowHeight ? `${rowHeight}px` : undefined }
      : undefined
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  return (
    <div className="doc-table-wrap">
      <table className="doc-table" style={section.styles}>
        <thead>
          <tr>
            {selected && <th className="doc-table-gutter" aria-hidden="true" />}
            {table.columns.map((label, col) => (
              <th key={col} className="doc-table-th-wrap">
                <div className="doc-table-th-inner">
                  <TableCell
                    value={label}
                    header
                    style={headerStyle}
                    onCommit={(value) =>
                      dispatch({ type: 'SET_TABLE_HEADER', id: section.id, col, value })
                    }
                  />
                  {selected && table.columns.length > 1 && (
                    <button
                      type="button"
                      className="doc-table-remove-col"
                      title="Remove column"
                      onPointerDown={stop}
                      onClick={(e) => {
                        stop(e)
                        dispatch({ type: 'REMOVE_TABLE_COLUMN', id: section.id, col })
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </th>
            ))}
            {selected && (
              <th className="doc-table-add-col-cell">
                <button
                  type="button"
                  className="doc-table-add-col"
                  title="Add column"
                  onPointerDown={stop}
                  onClick={(e) => {
                    stop(e)
                    dispatch({ type: 'ADD_TABLE_COLUMN', id: section.id })
                  }}
                >
                  +
                </button>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={r}>
              {selected && (
                <td className="doc-table-gutter">
                  <button
                    type="button"
                    className="doc-table-remove-row"
                    title="Remove row"
                    onPointerDown={stop}
                    onClick={(e) => {
                      stop(e)
                      dispatch({ type: 'REMOVE_TABLE_ROW', id: section.id, row: r })
                    }}
                  >
                    ✕
                  </button>
                </td>
              )}
              {table.columns.map((_, c) => (
                <TableCell
                  key={c}
                  value={row[c] ?? ''}
                  header={false}
                  style={bodyStyle}
                  onCommit={(value) =>
                    dispatch({ type: 'SET_TABLE_CELL', id: section.id, row: r, col: c, value })
                  }
                />
              ))}
              {selected && <td className="doc-table-add-col-cell" aria-hidden="true" />}
            </tr>
          ))}
        </tbody>
      </table>
      {selected && (
        <div className="doc-table-controls" onClick={stop}>
          <button
            type="button"
            className="btn"
            onClick={() => dispatch({ type: 'ADD_TABLE_ROW', id: section.id })}
          >
            + Row
          </button>
          <label className="doc-table-rows">
            Rows
            <input
              className="input"
              type="number"
              min={0}
              max={200}
              value={table.rows.length}
              onChange={(e) =>
                dispatch({
                  type: 'SET_TABLE_ROW_COUNT',
                  id: section.id,
                  count: Number(e.target.value),
                })
              }
            />
          </label>
        </div>
      )}
    </div>
  )
}

function SectionContent({ section }: { section: Section }) {
  switch (section.type) {
    case 'heading':
      return <EditableText section={section} tag="h2" />
    case 'subheader':
      return <EditableText section={section} tag="h3" />
    case 'text':
      return <EditableText section={section} tag="p" />
    case 'link':
      return <LinkSection section={section} />
    case 'divider':
      return <hr className="doc-divider" style={section.styles} />
    case 'spacer':
      return (
        <div className="doc-spacer" style={{ height: section.styles.height ?? '40px' }}>
          <span className="doc-spacer-label">Spacer</span>
        </div>
      )
    case 'image':
      return <ImageSection section={section} />
    case 'table':
      return <TableSection section={section} />
    case 'container':
      return (
        <div className="doc-container" style={section.styles}>
          {section.children.length === 0 && (
            <div className="container-empty">Drop sections here</div>
          )}
          <SectionList sections={section.children} parentId={section.id} />
        </div>
      )
    default:
      return null
  }
}

/** A horizontal line showing where a dragged section will be inserted. */
function DropLine() {
  return <div className="drop-line" aria-hidden="true" />
}

/** Renders a list of sections with insertion lines at the active drop point. */
export function SectionList({
  sections,
  parentId,
}: {
  sections: Section[]
  parentId: string | null
}) {
  const indicator = useDropIndicator()
  const lineAt = (i: number) =>
    indicator && indicator.parentId === parentId && indicator.index === i

  return (
    <>
      {sections.map((section, i) => (
        <Fragment key={section.id}>
          {lineAt(i) && <DropLine />}
          <SectionView section={section} />
        </Fragment>
      ))}
      {lineAt(sections.length) && <DropLine />}
    </>
  )
}

export function SectionView({ section }: { section: Section }) {
  const { state, dispatch } = useDocument()
  const isContainer = section.type === 'container'
  const dragData: DragData = { kind: 'section', id: section.id, isContainer }
  const dropData: DropData = { kind: 'section', id: section.id, isContainer }

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: section.id,
    data: dragData,
  })
  const { setNodeRef: setDropRef } = useDroppable({ id: section.id, data: dropData })
  const setNodeRef = (node: HTMLElement | null) => {
    setDragRef(node)
    setDropRef(node)
  }

  const selected =
    state.selected?.kind === 'section' && state.selected.id === section.id

  return (
    <div
      ref={setNodeRef}
      className={[
        'section-wrap',
        selected ? 'selected' : '',
        isDragging ? 'dragging' : '',
      ]
        .join(' ')
        .trim()}
      onClick={(e) => {
        e.stopPropagation()
        dispatch({ type: 'SELECT', selection: { kind: 'section', id: section.id } })
      }}
    >
      <div className="section-toolbar">
        <button
          type="button"
          className="drag-handle"
          title="Drag to reorder / move to Templates"
          {...listeners}
          {...attributes}
        >
          ⠿
        </button>
        <span className="section-label">{section.type}</span>
        <button
          type="button"
          className="icon-btn"
          title="Delete section"
          onClick={(e) => {
            e.stopPropagation()
            dispatch({ type: 'DELETE_SECTION', id: section.id })
          }}
        >
          ✕
        </button>
      </div>
      <SectionContent section={section} />
    </div>
  )
}
