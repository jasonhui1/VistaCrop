## 2024-05-03 - CSS Reset strips default focus rings
**Learning:** The custom CSS reset in `src/index.css` strips default focus outlines from `<button>` elements, leaving them inaccessible via keyboard.
**Action:** When adding or modifying interactive elements like buttons, always explicitly apply Tailwind `focus-visible` utility classes (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]`) inline to ensure keyboard focus states are visible and maintain accessibility.
