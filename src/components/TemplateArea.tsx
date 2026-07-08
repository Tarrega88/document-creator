import { useState } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useDocument } from '../state/documentStore'
import type { DragData, DropData } from '../dnd/dragTypes'
import type { Section, Template } from '../types'

/** A single section within a template. Draggable to reorder, accepts style
 *  drops, and can be removed. */
function TemplateSectionRow({
  template,
  section,
  removable,
}: {
  template: Template
  section: Section
  removable: boolean
}) {
  const { state, dispatch } = useDocument()
  const dropData: DropData = {
    kind: 'template-section',
    templateId: template.id,
    sectionId: section.id,
  }
  const dragData: DragData = {
    kind: 'template-section',
    templateId: template.id,
    sectionId: section.id,
    label: section.type,
  }
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `template-section-${template.id}-${section.id}`,
    data: dropData,
  })
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({ id: `drag-template-section-${template.id}-${section.id}`, data: dragData })

  const setNodeRef = (node: HTMLElement | null) => {
    setDragRef(node)
    setDropRef(node)
  }

  const selected =
    state.selected?.kind === 'template-section' &&
    state.selected.templateId === template.id &&
    state.selected.sectionId === section.id

  return (
    <div
      ref={setNodeRef}
      className={[
        'template-section-row',
        isOver ? 'drop-target' : '',
        isDragging ? 'dragging' : '',
        selected ? 'selected' : '',
      ]
        .join(' ')
        .trim()}
      title="Drag to reorder / click to edit styles"
      onClick={() =>
        dispatch({
          type: 'SELECT',
          selection: { kind: 'template-section', templateId: template.id, sectionId: section.id },
        })
      }
    >
      <button
        type="button"
        className="drag-handle"
        title="Drag to reorder"
        {...listeners}
        {...attributes}
      >
        ⠿
      </button>
      <span className="template-badge">{section.type}</span>
      <span className="template-section-spacer" />
      {removable && (
        <button
          type="button"
          className="icon-btn"
          title="Remove section from template"
          onClick={(e) => {
            e.stopPropagation()
            dispatch({
              type: 'REMOVE_TEMPLATE_SECTION',
              templateId: template.id,
              sectionId: section.id,
            })
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}

function TemplateChip({ template }: { template: Template }) {
  const { dispatch } = useDocument()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(template.name)
  const data: DropData = { kind: 'template', id: template.id }
  const { setNodeRef, isOver } = useDroppable({ id: `template-${template.id}`, data })

  const commit = () => {
    const trimmed = name.trim()
    dispatch({ type: 'RENAME_TEMPLATE', id: template.id, name: trimmed || template.name })
    if (!trimmed) setName(template.name)
    setEditing(false)
  }

  const startEditing = () => {
    setName(template.name)
    setEditing(true)
  }

  return (
    <div ref={setNodeRef} className={`template-chip ${isOver ? 'drop-target' : ''}`}>
      <div className="template-chip-header">
        {editing ? (
          <input
            className="input template-input"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') {
                setName(template.name)
                setEditing(false)
              }
            }}
          />
        ) : (
          <button
            type="button"
            className="template-name"
            title="Click to add this template to the document"
            onClick={() => dispatch({ type: 'INSTANTIATE_TEMPLATE', id: template.id })}
            onDoubleClick={startEditing}
          >
            {template.name}
          </button>
        )}
        <button
          type="button"
          className="icon-btn"
          title="Rename template"
          onClick={startEditing}
        >
          ✎
        </button>
        <button
          type="button"
          className="icon-btn"
          title="Delete template"
          onClick={() => dispatch({ type: 'DELETE_TEMPLATE', id: template.id })}
        >
          ✕
        </button>
      </div>
      <div className="template-sections">
        {template.sections.map((s) => (
          <TemplateSectionRow
            key={s.id}
            template={template}
            section={s}
            removable={template.sections.length > 1}
          />
        ))}
      </div>
    </div>
  )
}

export function TemplateArea() {
  const { state } = useDocument()
  const data: DropData = { kind: 'template-area' }
  const { setNodeRef, isOver } = useDroppable({ id: 'template-area', data })

  return (
    <div ref={setNodeRef} className={`template-area ${isOver ? 'drop-target' : ''}`}>
      {state.templates.length === 0 ? (
        <p className="hint">
          Drag a section here to save it as a template, then drop more sections onto the
          template to combine them.
        </p>
      ) : (
        state.templates.map((t) => <TemplateChip key={t.id} template={t} />)
      )}
    </div>
  )
}
