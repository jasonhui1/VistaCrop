## 2024-05-07 - Missing aria-labels on icon-only buttons
**Learning:** Found multiple icon-only buttons (like delete, undo, redo, expand/collapse sidebars) in the composer components missing `aria-label` attributes. This makes them inaccessible to screen readers.
**Action:** Always verify that icon-only buttons have an `aria-label` attribute describing their function.

## 2024-05-07 - Missing focus-visible indicators on interactive elements
**Learning:** The global CSS (`src/index.css`) strips default focus outlines from `<button>` elements (`outline: none`), and there are very few `focus-visible` utility classes applied inline throughout the application. This makes keyboard navigation almost impossible.
**Action:** Ensure all interactive elements, especially buttons and links, have explicit inline `focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:outline-none` styles applied to maintain keyboard accessibility while adhering to the design system. Add `relative z-10` where necessary for tightly packed elements.
