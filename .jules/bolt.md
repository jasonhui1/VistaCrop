## 2024-03-20 - Map lookup vs Array find for filters
**Learning:** O(N) Array.find lookups for filters in loops are slow over many iterations, especially when rendering or dragging.
**Action:** The project utilizes FILTERS array heavily. I should convert this to a Map lookup for O(1) performance in high-frequency rendering and exporting functions.
