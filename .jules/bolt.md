# Bolt's Journal
## 2026-03-26 - Optimize O(N) Lookups in Render Loops
**Learning:** In heavily rendered components (like canvas views), using `Array.find()` inside render loops or high-frequency event handlers (like dragging) creates an O(N*M) performance bottleneck as items and operations scale.
**Action:** Use `useMemo` to precompute O(1) `Map` structures for frequently accessed arrays like props or constants (e.g., `crops`, `placedItems`, `FILTERS`) to prevent unnecessary rendering lag.
