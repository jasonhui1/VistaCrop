## 2024-06-12 - Render loop layout thrashing from silent state updates
**Learning:** During drag operations in canvas components, silent state updates (`onUpdateItemSilent`) trigger continuous re-renders on every mouse move event. If the render loop contains `O(n)` lookups like `Array.prototype.find()` for item data mapping, it causes extreme layout thrashing and blocks the main thread.
**Action:** Always memoize associative arrays into `Map` objects (`O(1)`) using `useMemo` when they are queried inside heavily refreshed render loops or drag/drop handlers.
