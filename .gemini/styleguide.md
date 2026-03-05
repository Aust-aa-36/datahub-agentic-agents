# AI Agent Coding Styleguide — Austroads Data Info Hub

Expert guidelines for AI agents (Jules, Gemini, etc.) working on this repository. Follow these mandates to ensure compatibility with the Microsoft Power Pages environment.

## 1. Environment Constraints

### The Transformed Ancestor
- **Mandate**: Never use `position:fixed` inside HTML/CSS files intended for page content.
- **Why**: Power Pages wraps content in a CSS-transformed ancestor that breaks fixed positioning.
- **Rule**: If a fixed-position element is needed (modals, drawers), it must be built in JavaScript and appended to `document.body` (outside the wrapper).

### DOM Persistence
- **Mandate**: Avoid binding persistent event listeners directly to elements inside the page content.
- **Why**: Power Pages may re-render sections of the DOM, detaching standard listeners.
- **Rule**: Prefer inline `onclick` attributes or document-level event delegation (`document.addEventListener('click', (e) => { ... })`).

## 2. Deployment Workflow

### Source of Truth
- **Path**: Always edit files in `austroads-power-pages/`. This is the source of truth.
- **Mandate**: Never edit files directly in `austroads-power-pages-verify2/`.

### The Dual-Copy Pattern
- **Mandate**: When updating a page file (HTML, CSS, JS), you MUST copy it to TWO locations in the deployment folder:
  1. `web-pages/[page-folder]/[File].webpage.[type].[ext]`
  2. `web-pages/[page-folder]/content-pages/[File].en-US.webpage.[type].[ext]`
- **Verification**: Ensure `node sync.js` is run after every source edit to automate this pattern.

### CSS Delivery
- **Mandate**: Changes to `austroads-power-pages/shared/austroads.css` MUST be mirrored into the inline `<style>` block in `Austroads-Layout.webtemplate.source.html`.
- **Why**: Power Pages does not reliably load `.css` web files; inlined styles are the only guaranteed method.

## 3. JavaScript Standards

### Liquid Compatibility
- **Rule**: When reading data-attributes rendered by Liquid, always check if they contain `{{` or `}}`.
- **Snippet**:
  ```javascript
  const rawValue = element.dataset.firstName;
  const renderedValue = (rawValue && !rawValue.includes('{{')) ? rawValue : 'Guest';
  ```

### API Interaction
- **History**: AI Agent requests must always include the `history` array, sliced to the last 8 entries (4 complete turns).
- **Latency**: Use the `showSlowHint()` pattern (12s threshold) for all AI Builder calls to manage user expectations.

## 4. HTML Standards

### Main Content Only
- **Rule**: Page-specific `.html` files in the source folder should only contain the content that belongs inside the `<main>` tag.
- **Constraint**: Do not include `<!DOCTYPE>`, `<html>`, `<head>`, `<body>`, `<header>`, or `<footer>`. These are provided by the `Austroads-Layout` web template.
