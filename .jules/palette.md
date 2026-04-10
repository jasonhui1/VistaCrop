## 2024-04-10 - Icon-Only Action Buttons and Toggles Pattern
**Learning:** Found multiple instances of icon-only action buttons (e.g., Undo/Redo) and stateful toggles (e.g., Left/Right Sidebar Toggles) across the Composer view components that lacked proper accessibility labeling and keyboard focus visibility.
**Action:** When adding or updating icon-only buttons in this project, always include:
1. `aria-label` providing a clear text alternative for screen readers.
2. `aria-hidden="true"` on the purely visual child `<svg>` elements to hide them from the accessibility tree.
3. For toggles, use `aria-expanded` to communicate the state.
4. Use standard Tailwind focus ring classes (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]`) to ensure keyboard navigability and clear visual indication.
