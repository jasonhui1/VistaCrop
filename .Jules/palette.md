## 2024-05-02 - Custom CSS reset broke focus ring accessibility
**Learning:** The project's global CSS reset completely strips default focus outlines from button elements. This destroys keyboard navigation accessibility unless explicitly managed.
**Action:** Always check the global CSS reset. When building accessible interactive elements in this codebase, explicitly apply Tailwind 'focus-visible' utilities using the app's specific design tokens (e.g., 'focus-visible:ring-[var(--accent-primary)]') to restore keyboard-only focus indicators.
