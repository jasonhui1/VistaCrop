
## 2024-05-14 - Optimize High-Frequency Drag Events via Absolute Deltas
**Learning:** During high-frequency events like drag-and-drop (`handleMouseMove`), updating arrays by converting array objects using `O(N)` lookups combined with calculating relative position changes can lead to degraded performance.
**Action:** When updating incrementally changing values like polygon custom points, calculate them as absolute deltas from an initial state cache (`startItem`) instead of relative to the current state, and inject previously fetched objects (`startCrop`, `startItem`) directly into the local scope to bypass re-evaluation loops.
