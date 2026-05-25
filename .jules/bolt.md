## 2025-02-14 - Canvas Export Loop Bottleneck
**Learning:** Using Array.find() inside tight export loops for every panel/item (e.g., in `exportPanelMode` and `exportFreeformMode`) causes O(N*M) time complexity. Refactoring this to use a pre-constructed Map for `crops` provides a ~5.6x-6.2x performance improvement by turning it into an O(1) lookup.
**Action:** Always pre-index arrays into Maps/Sets before entering rendering or export loops that iterate over multiple items.
