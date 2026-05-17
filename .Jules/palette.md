## 2024-05-17 - Focus Rings in Tightly Packed Flex Layouts
**Learning:** When applying Tailwind focus rings (`focus-visible:ring-2`) to flex items or tightly packed interactive elements (like the toolbar buttons in `CanvasToolbar.jsx`), adjacent elements can clip or obscure the focus ring.
**Action:** Always explicitly include `relative focus-visible:z-10` alongside focus-visible classes for these elements to ensure the focus ring is fully visible and not clipped, without unnecessarily altering the normal stacking context.
