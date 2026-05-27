## 2024-05-27 - Implementing Accessible Tabbed Interfaces

**Learning:** When implementing accessibility for custom tabbed navigation components (e.g., `RightSidebar.jsx`), the container must use `role="tablist"` and the buttons must use `role="tab"` with `aria-selected` (not `aria-pressed`). Additionally, content panels require `role="tabpanel"` with `tabIndex={0}` and proper `aria-labelledby` bindings to ensure screen readers can navigate and read the content accurately.

**Action:** Always verify that custom interactive elements like tabs use the correct semantic `role` attributes and explicitly bind tabs to their respective panels. Ensure visual focus states are preserved alongside these semantic changes.
