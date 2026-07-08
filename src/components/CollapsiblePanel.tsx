import { useState, type ReactNode } from 'react'

interface Props {
  title: string
  defaultOpen?: boolean
  className?: string
  children: ReactNode
}

export function CollapsiblePanel({ title, defaultOpen = true, className, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`panel${className ? ` ${className}` : ''}${open ? ' open' : ''}`}>
      <button
        type="button"
        className="panel-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={`panel-caret ${open ? 'open' : ''}`}>▸</span>
        {title}
      </button>
      {open && <div className="panel-body">{children}</div>}
    </div>
  )
}
