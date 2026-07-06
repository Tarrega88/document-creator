import { useDraggable } from '@dnd-kit/core'
import { SECTION_DEFS, STYLE_DEFS } from '../data/palette'
import type { DragData } from '../dnd/dragTypes'

/** A draggable "section" building block. */
function PaletteSection({ def }: { def: (typeof SECTION_DEFS)[number] }) {
  const data: DragData = {
    kind: 'palette-section',
    sectionType: def.type,
    label: def.label,
  }
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-section-${def.type}`,
    data,
  })
  return (
    <div
      ref={setNodeRef}
      className={`palette-item ${isDragging ? 'dragging' : ''}`}
      {...listeners}
      {...attributes}
    >
      <span className="palette-icon">{def.icon}</span>
      {def.label}
    </div>
  )
}

/** A draggable "style" chip. */
function PaletteStyle({ def }: { def: (typeof STYLE_DEFS)[number] }) {
  const data: DragData = {
    kind: 'palette-style',
    styleId: def.id,
    style: def.style,
    label: def.label,
  }
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-style-${def.id}`,
    data,
  })
  return (
    <div
      ref={setNodeRef}
      className={`style-chip ${isDragging ? 'dragging' : ''}`}
      style={def.style}
      {...listeners}
      {...attributes}
    >
      {def.label}
    </div>
  )
}

export function SectionPalette() {
  return (
    <div className="palette-grid">
      {SECTION_DEFS.map((def) => (
        <PaletteSection key={def.type} def={def} />
      ))}
    </div>
  )
}

export function StylePalette() {
  return (
    <div className="chip-grid">
      {STYLE_DEFS.map((def) => (
        <PaletteStyle key={def.id} def={def} />
      ))}
    </div>
  )
}
