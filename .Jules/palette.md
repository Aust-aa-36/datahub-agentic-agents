## 2025-03-05 - Missing ARIA Role on Power Pages Tabs
**Learning:** Found a recurring accessibility pattern across all Power Pages detail components (`au-tab`) where `<button>` elements inside a `role="tablist"` container were missing their corresponding `role="tab"` attribute.
**Action:** When building or modifying tabbed interfaces in these templates, ensure that all interactive children of a `role="tablist"` explicitly declare `role="tab"` to maintain proper semantics for screen readers.
