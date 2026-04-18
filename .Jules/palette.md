## 2024-04-18 - Accessibility Improvements for Sidebar Toggles
**Learning:** Found that the sidebar toggle buttons in Composer mode (LeftSidebar and RightSidebar) are icon-only but lack ARIA attributes (`aria-label`, `aria-expanded`) and screen-reader hidden SVGs.
**Action:** Add `aria-label`, `aria-expanded={isOpen}`, and `aria-hidden="true"` to SVG to make icon-only sidebar toggle buttons accessible, along with proper `focus-visible` styling (`focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-[var(--accent-primary)]`) so they can be easily navigated using a keyboard.
