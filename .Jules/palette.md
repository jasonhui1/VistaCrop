## 2025-01-22 - WAI-ARIA Tabs and Flex Layout Focus Visibility

**Learning:** When implementing WAI-ARIA tabbed navigation (`role="tablist"` and `role="tab"` with `aria-selected`), focusing tab items in a flex container can cause the focus ring (`focus-visible:ring-2`) to be clipped by adjacent flex items if standard stacking order applies.

**Action:** Ensure tabs have `relative` positioning (if they don't already) and apply `focus-visible:z-10` alongside focus ring styles (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:z-10`) so the focused tab sits above adjacent elements, rendering the focus ring clearly. Do not use `aria-pressed` for tabs.
