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

function SectionContent({ section }: { section: Section }) {
  switch (section.type) {
    case 'heading':
      return <EditableText section={section} tag="h2" />
    case 'subheader':
      return <EditableText section={section} tag="h3" />
    case 'text':
      return <EditableText section={section} tag="p" />
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
