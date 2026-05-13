## 2026-05-13 - Accessibility of Interactive Toggle Lists
**Learning:** When building custom interactive toggle lists like filters, providing visual feedback via CSS focus states is important, but communicating the current state to screen readers is critical. Many custom lists lack native toggle semantics.
**Action:** Always ensure that toggle buttons in custom lists have an explicit `aria-pressed` attribute set to their active state, along with proper `aria-label` attributes and visible focus states using `focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:z-10`.
