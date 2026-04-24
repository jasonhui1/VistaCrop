
## 2024-04-24 - Accessible icon-only toggles
**Learning:** Found an accessibility issue pattern specific to icon-only buttons like the Expand/Collapse sidebar toggles. Without explicit labeling, screen readers cannot convey the button's purpose or state, and missing keyboard focus outlines make navigation difficult for keyboard users.
**Action:** Apply `aria-label` that updates conditionally based on state, `aria-expanded` to communicate toggle state, `aria-hidden="true"` on the visual SVGs, and consistent keyboard focus indicator classes (`focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-[var(--accent-primary)]`) using existing color variables across the codebase.
