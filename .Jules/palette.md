## 2026-04-27 - Accessible Icon Buttons in Composer
**Learning:** Icon-only toggle buttons in React toolbars often lack focus styles and descriptive ARIA labels when relying purely on SVG icons, making them inaccessible to keyboard and screen reader users.
**Action:** Always add `aria-label`, `aria-expanded` (for toggles), and visible focus states (e.g., `focus-visible:ring-2`) to all icon-only interactive elements.
