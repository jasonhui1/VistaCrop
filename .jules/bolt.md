## 2024-05-18 - Avoid Array.find() in render loops
**Learning:** In heavily rendered components like canvas views, using `Array.find()` for lookups (e.g., finding a filter by ID from a list) inside render loops or high-frequency event handlers creates an O(N*M) performance bottleneck, as it executes repeatedly on every frame/event.
**Action:** Always use precomputed O(1) Maps or lookup objects (e.g., `FILTER_MAP[id]`) instead of `Array.find()` to ensure stable performance, especially during operations like dragging or canvas rendering.
