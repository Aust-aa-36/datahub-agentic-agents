# Gemini Code Assist Style Guide — General Template

## Overview
This file configures Gemini Code Assist review rules for this repository.
These rules are applied to all Pull Requests.

---

## CRITICAL Rules (block merge if violated)

### SEC-001: No Hardcoded Credentials
Never accept hardcoded passwords, API keys, tokens, secrets, or connection strings.
```javascript
// FAIL
const token = 'eyJhbGciOiJSUzI1NiJ9...';
const password = 'MyP@ssw0rd';

// PASS (Use Environment Variables or Secret Managers)
const token = process.env.API_TOKEN;
```

### SEC-002: No PII in Logs
Log statements must never include email addresses, full names, phone numbers, or other personally identifiable information (PII).
```javascript
// FAIL
logger.info('Processing user email=' + userData.email);

// PASS
logger.info('Processing user id=' + userData.id);
```

### SEC-003: Input Validation
All external data (API responses, user input, webhook payloads) must be validated before use.

---

## Code Quality Rules

### CODE-001: Clear Naming Conventions
Variables and functions should have descriptive names.
- Avoid single-letter variables (except `i`, `j` in loops).
- Use `camelCase` for variables/functions (or language-specific standard like `snake_case` for Python).

### CODE-002: Error Handling
Always handle errors gracefully. Avoid empty `catch` blocks.
```javascript
// FAIL
try {
  doSomething();
} catch (e) {}

// PASS
try {
  doSomething();
} catch (e) {
  logger.error('Failed to doSomething', e);
}
```

---

## Testing Standards

### TEST-001: Test Coverage
Ensure new features include unit tests.
- Aim for high coverage on critical paths.
- Mock external dependencies (APIs, Databases).

---

## Documentation Standards

### DOC-001: Comments
- Explain *why* complex logic exists, not *what* it does.
- Public functions should have docstrings/JSDoc.

---

## Jules AI Interaction
When Gemini requests changes on a Jules-authored PR:
1. Be specific: reference the rule code (e.g. `SEC-001`) in the review comment.
2. Provide the corrected code pattern inline.
3. Use "Request changes" for CRITICAL violations.
