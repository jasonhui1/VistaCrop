## 2024-05-20 - Adding Keyboard Focus to Sidebars
**Learning:** Found an accessibility issue pattern specific to this app's components: Icon-only toggles in `LeftSidebar` and `RightSidebar` lacked `aria-label`, `aria-expanded` and explicit focus-visible states. This makes keyboard navigation very difficult for users.
**Action:** Always add `aria-label`, `aria-expanded`, and `focus-visible:ring-2 focus-visible:outline-none` style patterns to purely visual or icon-only interactive elements in React components.
