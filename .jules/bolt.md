## 2025-02-18 - Optimized filter and crop lookups in Canvas Export
**Learning:** In the specific canvas export loop environment, `Map.get` provides a massive O(1) speedup compared to `Array.find` for lookups across large sets. Repeated `crops.find` loops combined with `FILTERS.find` lookups caused measurable bottlenecks in `exportPanelMode` and `exportFreeformMode`.
**Action:** When working on similar loops, especially within high-iteration canvas render operations, favor pre-constructed `Map` objects over repeated `Array.find` calls to achieve O(1) performance gains.
