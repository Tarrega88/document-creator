import { CollapsiblePanel } from './CollapsiblePanel'
import { GlobalStyles } from './GlobalStyles'
import { SectionPalette } from './Palette'
import { TemplateArea } from './TemplateArea'

export function Sidebar() {
  return (
    <aside className="sidebar">
      <CollapsiblePanel title="Page Defaults" defaultOpen={false}>
        <GlobalStyles />
      </CollapsiblePanel>
      <CollapsiblePanel title="Sections">
        <SectionPalette />
      </CollapsiblePanel>
      <CollapsiblePanel title="Templates" className="panel-fill">
        <TemplateArea />
      </CollapsiblePanel>
    </aside>
  )
}
