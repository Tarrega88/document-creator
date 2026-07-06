import { useEffect, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Canvas } from './components/Canvas'
import { Inspector } from './components/Inspector'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { createSection } from './data/palette'
import { DocumentProvider } from './state/DocumentContext'
import { useDocument } from './state/documentStore'
import { containsId, findSection, locateSection } from './state/documentReducer'
import { DropIndicatorContext, type DropIndicator } from './dnd/dropIndicator'
import type { DragData, DropData } from './dnd/dragTypes'
import './App.css'

/** Robustly resolve the drop target. We merge pointer-based hits with
 *  rectangle-intersection hits so the section under the cursor is detected
 *  even on a fast drop, then rank the candidates so a section/template wins
 *  over the page root, and a deeper (smaller) node wins over a shallower one. */
const collisionDetection: CollisionDetection = (args) => {
  const merged = [...pointerWithin(args)]
  for (const hit of rectIntersection(args)) {
    if (!merged.some((m) => m.id === hit.id)) merged.push(hit)
  }
  const rank = (id: string) => (id === 'canvas-root' || id === 'template-area' ? 1 : 0)
  const area = (id: string) => {
    const r = args.droppableRects.get(id)
    return r ? r.width * r.height : Number.POSITIVE_INFINITY
  }
  return merged.sort(
    (a, b) =>
      rank(String(a.id)) - rank(String(b.id)) || area(String(a.id)) - area(String(b.id)),
  )
}

function Workspace() {
  const { state, dispatch } = useDocument()
  const [active, setActive] = useState<DragData | null>(null)
  const [indicator, setIndicator] = useState<DropIndicator | null>(null)

  // Pasting an image from the clipboard adds it as a new image section.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (!item.type.startsWith('image/')) continue
        const file = item.getAsFile()
        if (!file) continue
        e.preventDefault()
        const reader = new FileReader()
        reader.onload = () => {
          const section = createSection('image')
          section.src = String(reader.result)
          dispatch({ type: 'ADD_SECTION_OBJECT', section })
        }
        reader.readAsDataURL(file)
        break
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [dispatch])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const onDragStart = (e: DragStartEvent) => {
    setActive((e.active.data.current as DragData) ?? null)
  }

  // Work out where the dragged item would land, for the insertion line.
  const computeIndicator = (e: DragOverEvent | DragEndEvent): DropIndicator | null => {
    const a = e.active.data.current as DragData | undefined
    const o = e.over?.data.current as DropData | undefined
    if (!a || !o || a.kind === 'palette-style') return null
    if (o.kind === 'template-area' || o.kind === 'template') return null

    let candidate: DropIndicator | null = null
    if (o.kind === 'canvas-root') {
      candidate = { parentId: null, index: state.sections.length }
    } else if (o.kind === 'section') {
      if (a.kind === 'section' && a.id === o.id) return null
      if (o.isContainer) {
        const container = findSection(state.sections, o.id)
        candidate = { parentId: o.id, index: container ? container.children.length : 0 }
      } else {
        const loc = locateSection(state.sections, o.id)
        if (!loc) return null
        const overRect = e.over?.rect
        const activator = e.activatorEvent as PointerEvent
        const pointerY = (activator?.clientY ?? 0) + e.delta.y
        const after = overRect ? pointerY > overRect.top + overRect.height / 2 : false
        candidate = { parentId: loc.parentId, index: after ? loc.index + 1 : loc.index }
      }
    }
    if (!candidate) return null
    // Never indicate a drop into the dragged section's own subtree.
    if (a.kind === 'section' && candidate.parentId) {
      const moving = findSection(state.sections, a.id)
      if (moving && containsId(moving, candidate.parentId)) return null
    }
    return candidate
  }

  const onDragOver = (e: DragOverEvent) => {
    setIndicator(computeIndicator(e))
  }

  const onDragEnd = (e: DragEndEvent) => {
    const a = e.active.data.current as DragData | undefined
    const o = e.over?.data.current as DropData | undefined
    const ind = indicator
    setActive(null)
    setIndicator(null)
    if (!a) return

    if (a.kind === 'palette-style') {
      if (o?.kind === 'section') {
        dispatch({ type: 'APPLY_STYLE', id: o.id, style: a.style })
      } else if (o?.kind === 'template') {
        dispatch({ type: 'APPLY_STYLE_TO_TEMPLATE', id: o.id, style: a.style })
      }
      return
    }

    if (a.kind === 'palette-section') {
      if (o?.kind === 'template-area') {
        dispatch({ type: 'ADD_TEMPLATE', section: createSection(a.sectionType) })
      } else if (ind) {
        dispatch({
          type: 'ADD_SECTION',
          sectionType: a.sectionType,
          parentId: ind.parentId ?? undefined,
          index: ind.index,
        })
      } else {
        dispatch({ type: 'ADD_SECTION', sectionType: a.sectionType })
      }
      return
    }

    // Dragging an existing canvas section.
    if (a.kind === 'section') {
      if (o?.kind === 'template-area') {
        const source = findSection(state.sections, a.id)
        if (source) dispatch({ type: 'ADD_TEMPLATE', section: source })
      } else if (ind) {
        dispatch({
          type: 'MOVE_SECTION',
          id: a.id,
          parentId: ind.parentId ?? undefined,
          index: ind.index,
        })
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActive(null)
        setIndicator(null)
      }}
    >
      <DropIndicatorContext.Provider value={indicator}>
        <PageRules />
        <div className="app">
          <Toolbar />
          <div className="workspace">
            <Sidebar />
            <Canvas />
            <Inspector />
          </div>
        </div>
      </DropIndicatorContext.Provider>
      <DragOverlay dropAnimation={null}>
        {active ? (
          <div className="drag-overlay">
            {active.kind === 'section' ? 'Moving section' : active.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

/** Injects a print @page rule so the PDF uses the same sheet size and side
 *  margins as the editor. The top/bottom margin setting is only a visual guide
 *  in the editor, so it is intentionally not applied as a print margin — this
 *  keeps page breaks at the same sheet-height boundaries in both views. */
function PageRules() {
  const { state } = useDocument()
  const css = `@page { size: 210mm ${state.sheetHeight}mm; margin: 0 20mm; }`
  return <style>{css}</style>
}

export default function App() {
  return (
    <DocumentProvider>
      <Workspace />
    </DocumentProvider>
  )
}
