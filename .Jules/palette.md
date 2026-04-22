## 2026-04-22 - Accessible Icon Toggles
**Learning:** Icon-only sidebar toggles were missing ARIA labels and focus rings, causing accessibility issues for screen readers and keyboard navigation.
**Action:** Added `aria-label`, `aria-expanded` attributes, `aria-hidden="true"` to child SVGs, and consistent visible focus rings (`focus-visible:ring-2`) to sidebar toggle buttons to improve accessibility.
