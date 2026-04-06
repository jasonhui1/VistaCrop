
## 2024-04-06 - Accessible Icon-Only Toggles in Sidebars
**Learning:** The sidebars in the Composer view (LeftSidebar and RightSidebar) contained icon-only toggle buttons without ARIA labels, aria-expanded states, or clear focus rings, which creates accessibility issues for screen readers and keyboard navigation.
**Action:** When working with collapsible UI areas (like sidebars), always ensure the toggle buttons have descriptive `aria-label` attributes that update based on state (e.g., 'Expand' vs 'Collapse'), include `aria-expanded` to communicate state to assistive tech, use `focus-visible` classes to provide clear keyboard focus indicators, and hide purely visual icons with `aria-hidden='true'`.
