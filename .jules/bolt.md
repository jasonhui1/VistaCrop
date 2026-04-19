## 2024-06-25 - React MouseMove Event Optimization

**Learning:** Modifying incrementally tracking state that depends on `setDragState` on every `mousemove` tick causes full component re-renders and lags drag operations. Looking up arrays via `find` inside the callback also increases overhead per frame.

**Action:** Cache the necessary values (`startItem`, `startCrop`, `startPoints`) in the initial drag initialization (`mousedown`), eliminate `useCallback` dependencies on large arrays, and compute absolute delta positions inside `mousemove` to avoid triggering repeated React render cycles during continuous drag updates.
