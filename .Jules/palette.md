## 2024-05-11 - Manual Focus-Visible Required due to Custom Reset
**Learning:** The custom CSS reset in `index.css` strips default focus outlines from `<button>` elements. Additionally, for async operations, the standard SVG icons can be conditionally animated for better micro-interaction feedback.
**Action:** Always manually apply Tailwind's `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]` to interactive elements to maintain keyboard accessibility. Use conditional `animate-spin` on loading SVG icons.
