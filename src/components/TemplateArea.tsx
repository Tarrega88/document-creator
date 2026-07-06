import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useDocument } from '../state/documentStore'
import type { DropData } from '../dnd/dragTypes'
import type { Template } from '../types'

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
          <span className="template-badge">{template.section.type}</span>
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
  )
}

export function TemplateArea() {
  const { state } = useDocument()
  const data: DropData = { kind: 'template-area' }
  const { setNodeRef, isOver } = useDroppable({ id: 'template-area', data })

  return (
    <div ref={setNodeRef} className={`template-area ${isOver ? 'drop-target' : ''}`}>
      {state.templates.length === 0 ? (
        <p className="hint">Drag a section here to save it as a template.</p>
      ) : (
        state.templates.map((t) => <TemplateChip key={t.id} template={t} />)
      )}
    </div>
  )
}
