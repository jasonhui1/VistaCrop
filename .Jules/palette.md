## 2024-05-04 - Custom CSS Reset Removes Default Focus
**Learning:** The custom CSS reset in `src/index.css` strips default focus outlines from `<button>` elements, rendering keyboard navigation invisible for users.
**Action:** Always explicitly apply Tailwind `focus-visible` utility classes (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]`) inline to interactive elements. For tightly packed flex items, include `relative z-10`.
