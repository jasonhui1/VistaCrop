## 2024-05-15 - Array.find in Export Loops
**Learning:** O(n^2) lookups inside export rendering loops using `Array.find` for crops can cause severe performance degradation, especially with many items or panels. Replacing it with a pre-constructed Map lookup transforms this to O(n) and yields ~6x improvement.
**Action:** Always pre-construct Maps for reference data lookups (like crops or assets) before entering rendering or export loops.
