## 2024-05-24 - Accessibility for Icon-Only Buttons

**Learning:** Action buttons in toolbars that use only icons (such as "Undo" and "Redo") are completely inaccessible to screen readers without explicit ARIA labels. Relying on `title` attributes is not sufficient for a robust experience, especially for users relying on touch and screen readers concurrently.
**Action:** When implementing new toolbars or control panels, ensure that all interactive elements lacking visible text content are equipped with a clear and descriptive `aria-label` attribute.
