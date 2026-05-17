## 2024-05-17 - O(1) Map Lookups in Canvas Export Loops
**Learning:** Using Map.get provides a ~5.6x-6.2x speedup over Array.find inside high-frequency rendering loops.
**Action:** Always pre-compute Map dictionaries for repeated lookups (like crops or filters) before entering a loop to avoid O(n) array searches.
