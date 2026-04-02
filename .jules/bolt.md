## 2024-04-02 - Array.find inside render loops
**Learning:** Doing an O(N) array lookup `FILTERS.find(f => f.id === filterName)` repeatedly inside map or render methods creates an unnecessary bottleneck.
**Action:** Precompute an O(1) map `const FILTER_CSS_MAP = Object.fromEntries(FILTERS.map(f => [f.id, f.css]))` or use a `useMemo` outside loops to avoid finding in every iteration.
