## 2025-02-12 - Drag state dependency removal
**Learning:** During high-frequency drag events in `FreeformCanvas.jsx`, storing large, frequently updated dependency arrays like `crops` and `placedItems` inside `useCallback` causes the render-blocking `handleMouseMove` function to be recreated constantly, creating GC pressure.
**Action:** Remove dynamic arrays from the `handleMouseMove` dependency array by caching the required individual item states into the base `dragState` object during the initialization event (`mousedown`), ensuring O(1) lookups and stable closure references.
