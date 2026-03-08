## 2025-03-05 - [Unsafe JSON parsing from LLM outputs]
**Vulnerability:** Application parsing raw LLM string outputs via `JSON.parse` directly, with no error handling or schema validation.
**Learning:** This is a denial-of-service/availability risk, as LLMs often return incorrectly formatted JSON, wrapped in markdown blocks (e.g. ````json````), which throws uncaught exceptions in Node, crashing the orchestration flow and leaving the user without an actionable fallback path.
**Prevention:** Always sanitize LLM responses (stripping markdown) before parsing, wrap parsing logic in a `try-catch`, and strictly enforce object structures using schema validation libraries like `zod` (`safeParse`) to guarantee type safety and provide secure default states on failure.

## 2024-05-24 - [CRITICAL] OData Injection in Dataverse Queries
**Vulnerability:** Unsanitized user inputs (`input.product` and `input.userRole`) were being directly interpolated into Dataverse OData `$filter` and `$expand` queries, allowing potential OData injection attacks.
**Learning:** This repository integrates directly with Microsoft Dataverse APIs. Similar to SQL injection, malicious inputs containing single quotes (`'`) or other special OData syntax could manipulate queries to bypass entitlement checks or access unauthorized data.
**Prevention:** Always sanitize user inputs before using them in Dataverse OData queries. Escape single quotes (replace `'` with `''`) and use `encodeURIComponent` to prevent injection and URL parameter pollution.