## 2024-05-24 - Array.find in rendering loops
**Learning:** Using `Array.find` inside rendering loops (like canvas export loops iterating over panels or items) can cause significant overhead when the array size grows, as it scales O(N*M).
**Action:** Always pre-construct a `Map` from arrays before entering tight rendering loops to convert O(N) lookups into O(1) hash map lookups.
