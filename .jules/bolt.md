## 2024-04-22 - Optimize Drag Rendering Handlers

**Learning:** During high-frequency drag events, calculating incrementally changing values using absolute deltas from an initial `startItem` state avoids O(N) array lookups (like `crops.find()` or `placedItems.find()`). It also prevents unnecessary full component re-renders that occur when using setters like `setDragState` on every single frame during a continuous movement.
**Action:** Always cache the initial state (e.g. `startItem` and related elements like `startCrop`) inside the initial pointer event's state object (like `dragState` on `mousedown`), and calculate mouse movement absolute deltas against this immutable starting state instead of relative to a continuously updating current state.
