## 2024-04-20 - Adding Accessibility to Sidebar Toggle Buttons
**Learning:** Found that icon-only buttons for toggling sidebars lacked `aria-label`, `aria-expanded` and visual focus rings. These patterns often exist in collapsible panels that are heavily relied upon by users navigating via keyboard.
**Action:** When finding a toggle-based component, always check for `aria-expanded` state tracking, `aria-label` for screen readers (if no text exists inside the button), `aria-hidden` on purely decorative SVGs, and apply visual focus rings.
