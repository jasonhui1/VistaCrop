## 2024-05-24 - Accessible Sidebar Toggles
**Learning:** The Left and Right Sidebar toggles were icon-only and lacked appropriate ARIA roles, labels, and visible focus indicators, making them inaccessible for keyboard and screen reader users.
**Action:** Add `aria-label`, `aria-expanded`, and `aria-hidden` attributes on purely visual inner SVGs, and use utility classes for focus rings (e.g. `focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-[var(--accent-primary)]`) for icon-only action toggles.
