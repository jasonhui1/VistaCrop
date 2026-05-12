## 2024-05-12 - Focus outlines
**Learning:** The custom CSS reset in `src/index.css` strips default focus outlines from `<button>` elements. To maintain keyboard accessibility, always explicitly apply Tailwind `focus-visible` utility classes (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]`) inline to interactive elements.
**Action:** Applied to various button components, and always check that `focus-visible` is implemented.
