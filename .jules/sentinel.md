## 2024-05-20 - [CRITICAL] OData Injection in Knowledge Retrieval
**Vulnerability:** The Dataverse OData query string in `genkit-agent/src/index.ts` within the `getKnowledgeTool` was susceptible to OData injection. User inputs (`input.product` and `input.userRole`) were directly concatenated into the `$filter` and `$expand` statements.
**Learning:** This could allow an attacker to craft input that alters the query logic, potentially bypassing the `cre52_entitlement_RelatedArticle` security check or exposing internal database structure.
**Prevention:** Always escape single quotes (`'` to `''`) in user inputs when constructing OData literal strings. Even better, if the library supports it, use parameterized queries.
