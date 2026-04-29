## 2026-04-29 - Missing Focus Rings on Buttons
**Learning:** The project's custom `button` CSS reset removes default outlines/rings on focus, but many buttons lack explicit `focus-visible` styles. This makes keyboard navigation difficult or impossible.
**Action:** Always add explicit focus-visible utility classes (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]`) to interactive elements like `button` to ensure a11y, especially when the global styles strip default focus indicators.
