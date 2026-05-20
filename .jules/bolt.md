## 2024-05-20 - Optimize array lookups in export loops
**Learning:** Replacing Array.find lookups for crops with a pre-constructed Map yields a ~5.6x-6.2x performance improvement in export loops.
**Action:** Always prefer pre-constructing Maps for O(1) lookups inside tight loops, especially when rendering or exporting multiple items.
