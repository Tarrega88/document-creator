import { CollapsiblePanel } from './CollapsiblePanel'
import { GlobalStyles } from './GlobalStyles'
import { SectionPalette, StylePalette } from './Palette'
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
      <CollapsiblePanel title="Styles">
        <StylePalette />
      </CollapsiblePanel>
      <CollapsiblePanel title="Templates">
        <TemplateArea />
      </CollapsiblePanel>
    </aside>
  )
}
