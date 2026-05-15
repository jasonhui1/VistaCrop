## 2024-05-15 - Missing Focus Rings
**Learning:** Interactive elements are completely missing focus rings across the app, degrading keyboard accessibility, especially because the custom CSS reset strips default button outlines.
**Action:** Add focus rings (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]`) to interactive elements.
