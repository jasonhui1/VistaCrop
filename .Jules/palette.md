## 2024-05-06 - Focus Ring Visibility in Packed Layouts

**Learning:** The application uses a custom CSS reset that strips default focus outlines. When adding Tailwind's `focus-visible:ring-2` to elements that are tightly packed or have borders (like the sidebar toggle buttons or adjacent flex tab buttons), the focus ring can be clipped or completely hidden by the boundaries of the parent container or the layout context of adjacent sibling elements.

**Action:** Whenever applying `focus-visible:ring-2` to interactive elements in flex layouts, border-heavy layouts, or grid components, always add `relative z-10` along with the focus ring classes. This pulls the focused element into a higher stacking context, ensuring its focus ring can expand visually over adjacent element borders without being hidden.
