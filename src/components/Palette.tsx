import { useDraggable } from '@dnd-kit/core'
import { SECTION_DEFS } from '../data/palette'
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

export function SectionPalette() {
  return (
    <div className="palette-grid">
      {SECTION_DEFS.map((def) => (
        <PaletteSection key={def.type} def={def} />
      ))}
    </div>
  )
}
