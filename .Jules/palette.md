## 2025-05-05 - Focus Outlines Stripped by Custom CSS Reset
**Learning:** The custom CSS reset in this application (`src/index.css`) strips default focus outlines from `<button>` and `<input>` elements. This causes standard keyboard navigation to have no visual indicator.
**Action:** Restore focus visibility using inline Tailwind utility classes `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]`. For tightly packed elements (e.g., flex children), also add `relative z-10` so the focus ring is not clipped.
