## 2025-04-10 - Sidebar Toggle Accessibility
**Learning:** Found that the sidebar toggle buttons in `LeftSidebar.jsx` and `RightSidebar.jsx` were icon-only and missing `aria-label`, `aria-expanded`, and explicit focus styles, making them completely inaccessible to screen reader and keyboard users.
**Action:** Applied `aria-label`, `aria-expanded`, `aria-hidden="true"` to the inner SVGs, and utilized existing Tailwind CSS variables for focus rings (`focus-visible:ring-[var(--accent-primary)]`) to adhere to design system guidelines and improve accessibility.
