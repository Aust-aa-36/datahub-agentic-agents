## 2026-03-04 - Caching dynamically updated DOM nodes is risky
**Learning:** Optimizations like caching `document.querySelectorAll()` outside of event listeners can cause regressions if the nodes can be dynamically added or modified after the initial cache.
**Action:** When implementing DOM caching, carefully analyze if the elements are purely static. If there's a risk they might be dynamically updated (like search cards), only debounce the input handler and avoid caching the selector query to guarantee safety while maintaining performance improvements.
