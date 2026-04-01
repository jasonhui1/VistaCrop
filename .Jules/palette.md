# Palette Journal

## 2024-04-01 - Add accessibility to sidebar toggles
**Learning:** Icon-only toggle buttons in the app's sidebars lacked necessary ARIA attributes (`aria-label`, `aria-expanded`) and visible keyboard focus states (`focus-visible:ring-2`, `focus-visible:outline-none`). In addition, the decorative SVG icons themselves didn't have `aria-hidden="true"`.
**Action:** Always ensure icon-only buttons include an `aria-label`, and interactive toggles reflect their state with `aria-expanded` or `aria-pressed`. Decorative SVGs inside these buttons should be explicitly hidden from screen readers using `aria-hidden="true"`.
