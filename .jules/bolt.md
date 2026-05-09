## 2025-05-09 - Map.get vs Array.find for High-Frequency Lookups
**Learning:** Found an edge-case performance pattern: O(1) Map.get provides a measurable speedup (approx. 3.2x-3.7x) over O(N) Array.find for lookups within small datasets (like the FILTERS array with only 9 elements) when executed over high-frequency iterations.
**Action:** When identifying small constant arrays used in frequent render loops or callbacks, export an accompanying Map from the constant array to provide O(1) lookups.
