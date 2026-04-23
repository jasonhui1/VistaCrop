## 2024-05-18 - Missing ARIA labels in icon-only buttons
**Learning:** Found multiple icon-only buttons without `aria-label`s in `src/components/composer/CanvasToolbar.jsx` (e.g., Undo, Redo, Load, Save, Export). These buttons are crucial for the composer view but completely inaccessible to screen reader users. Also lacking focus rings for keyboard navigation.
**Action:** Add descriptive `aria-label` attributes to these buttons based on their existing `title` attributes or inner text. Add focus-visible utilities to make keyboard navigation clearer.
