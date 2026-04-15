## 2025-04-15 - Icon-only Toggles
**Learning:** Found that icon-only interactive elements like sidebar toggles were missing ARIA labels and keyboard focus states, making them inaccessible.
**Action:** Always add `aria-label`, `aria-expanded` (for toggles), `aria-hidden="true"` on internal SVGs, and clear `focus-visible` ring classes to icon-only buttons.
