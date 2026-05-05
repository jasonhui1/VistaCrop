
## $(date +%Y-%m-%d) - Optimizing high-frequency canvas drag events
**Learning:** In React canvas applications, incrementally updating state (like polygon coordinates) and looking up related records using `Array.find` within high-frequency mouse move handlers (which fire 60+ times per second) causes massive frame drops due to continuous, heavy re-renders and `O(N)` lookups blocking the main thread.
**Action:** When handling complex drag interactions, always perform lookups (`Array.find`) during the initialization event (`mousedown`) and cache the result in the drag state. During the drag (`mousemove`), compute continuous changes as absolute deltas from the cached initial state, completely bypassing continuous React state updates and array lookups inside the high-frequency loop.
