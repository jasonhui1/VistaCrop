## 2024-05-24 - Map.get vs Array.find in Export Loops
**Learning:** In this codebase's architecture, O(1) `Map.get` provides a massive speedup over O(n) `Array.find` for data lookups. It yields ~5.6x-6.2x improvement in the export loop and ~3.2x-3.7x for filter lookups.
**Action:** When iterating over large arrays where frequent ID lookups are required (like rendering or exporting loops), eagerly construct a `Map` outside the loop to handle lookups instead of using `Array.find`.
