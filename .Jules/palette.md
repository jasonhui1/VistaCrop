
## 2023-11-20 - Accessible visual picker buttons
**Learning:** Icon-only visual picker buttons (like color dots or minimal controls) easily fail accessibility checks if they lack explicitly defined `aria-label`, state tracking like `aria-pressed`, and clear `focus-visible` styles for keyboard navigation.
**Action:** When adding or maintaining icon-only toggle buttons in the application, specifically ensure `aria-label`, `aria-pressed` based on active state, `aria-hidden` on the purely visual children, and visible focus rings using `focus-visible:ring-2` are implemented.
