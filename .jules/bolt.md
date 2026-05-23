## 2024-05-23 - Replaced Array.find with Map for performance in export loops
**Learning:** Using `Array.find` inside tight loops like exporting canvas panels or items is slow; pre-constructing Maps for `crops` and `FILTERS` improves performance.
**Action:** When performing multiple lookups inside a loop, pre-construct a Map before the loop and use `.get()` for O(1) lookups.
