## 2024-05-18 - Missing ARIA Labels on Icon-Only Toolbar Buttons
**Learning:** The `CanvasToolbar` component in the composer uses many icon-only buttons (e.g., Undo, Redo, Load, Delete canvas, Save, Export) that rely on `title` attributes for tooltips but completely lack `aria-label` attributes. This makes them inaccessible to screen readers which may not reliably read the `title` attribute.
**Action:** Always add `aria-label` to icon-only buttons, even if they have a `title` attribute for visual tooltips, to ensure full accessibility for screen reader users.
