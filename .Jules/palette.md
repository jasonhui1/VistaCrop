## 2024-05-29 - Accessible Tabbed Interfaces

**Learning:** When implementing WAI-ARIA tabbed interfaces, adding `role="tablist"`, `role="tab"`, and `aria-selected` improves semantics for screen readers. However, standard `<button>` elements should be used for native Tab key navigation if custom arrow key handlers are not provided, avoiding roving `tabIndex` attributes that could break accessibility.

**Action:** Always ensure tab containers have `role="tablist"` with an `aria-label`, and tab items have `role="tab"` and `aria-selected={boolean}`. Rely on native button focus management when standard arrow-key tab navigation is not implemented.
