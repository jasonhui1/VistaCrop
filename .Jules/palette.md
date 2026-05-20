
## 2023-10-27 - Focus rings on tightly packed or flex items
**Learning:** When applying Tailwind focus rings (`focus-visible:ring-2`) to flex items or tightly packed interactive elements (like custom mode toggles or tab buttons), the focus ring may be clipped by adjacent elements without an altered stacking context.
**Action:** Include `relative focus-visible:z-10` along with the focus ring classes to ensure the ring is fully visible and overlapping siblings without permanently changing the normal layout. Also remember to use `aria-pressed` for toggle states.
