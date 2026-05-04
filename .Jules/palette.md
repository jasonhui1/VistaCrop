## 2024-05-04 - Focus visibility on tightly packed interactive elements
**Learning:** When using Tailwind's `focus-visible:ring-2` on closely spaced interactive flex items (like icon buttons in a toolbar), the focus ring can be clipped or hidden by adjacent elements if they share the same z-index context.
**Action:** Always add `relative z-10` along with `focus-visible:ring-2` on interactive list/toolbar items to ensure the focus indicator is fully visible on top of sibling elements.
