## 2024-05-30 - Map lookups over Array.find in rapid renders
**Learning:** During drag operations in canvas components, silent state updates (`onUpdateItemSilent`) trigger continuous re-renders. Using O(N) array lookups (like `Array.find`) inside these render loops causes layout thrashing and main thread blocking.
**Action:** Always memoize lookup operations (mapping item IDs to data) into O(1) structures like `Map` using `useMemo` when they are accessed inside frequent render cycles or drag-and-drop callbacks.
