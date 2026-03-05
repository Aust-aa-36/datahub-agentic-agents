# Austroads Data Info Hub — AI Agent

## Overview

The Data Hub Assistant is a chat agent embedded in the home page of the Austroads Data Info Hub Power Pages site. It allows authorised users to ask natural-language questions about NEVDIS and TCA data products and receive concise, accurate answers without needing to browse the full catalogue.

---

## Architecture

```
User types question
       │
       ▼
Chat drawer (home page)
  home.js — fetch() POST
       │
       ▼
Power Automate HTTP trigger
  Method: POST
  Body: { "message": "...", "sessionId": "..." }
       │
       ▼
AI Builder — "Create text with GPT"
  System prompt (system-prompt.txt) + user message
       │
       ▼
Response action
  Body: { "reply": "..." }
  Header: Access-Control-Allow-Origin: *
       │
       ▼
Chat drawer renders bot reply
```

---

## Files

| File | Purpose |
|------|---------|
| `agent-skill/system-prompt.txt` | Full knowledge base loaded into AI Builder. Contains all NEVDIS and TCA product descriptions, access requirements, and contacts. Edit here to update what the agent knows. |
| `agent-skill/power-automate-flow.md` | Step-by-step guide to build or rebuild the Power Automate flow. |
| `home/home.js` | Chat drawer logic — open/close panel, send message, render replies, timeout/retry. Contains the Power Automate endpoint URL. |
| `home/home.css` | Agent panel styles — fixed overlay, slide-in animation, chat bubbles, AI button colour. |
| `home/page-body.html` | Deployed HTML fragment for the home page. Contains the agent panel markup and open buttons. |

---

## Power Automate Flow

**Flow name:** `Datahub-Agent-Skill`
**Trigger:** When an HTTP request is received (POST)

### Request body schema
```json
{
  "message": "string",
  "sessionId": "string"
}
```

### Response body
```json
{
  "reply": "string"
}
```

The flow URL (including SAS signature) is stored in `home.js` as the `AGENT_ENDPOINT` constant. If the flow is recreated, update this URL and redeploy.

For full setup instructions see `power-automate-flow.md`.

---

## System Prompt

`system-prompt.txt` is the agent's complete knowledge base. It is pasted directly into the AI Builder "Create text with GPT" action in Power Automate, followed by the user's message.

It covers:
- 10 NEVDIS data products (Vehicles & Registrations, National VIN Database, Driver Licences, SWOVS, Gold Data, Plate-to-VIN, Safety Recalls, AEC, BITRE, Enabling RAV)
- 7 TCA data products (EMS, Spatiotemporal, Spatial Data Services, Road Analytics, Smart OBM, HPFR, New Zealand study)
- Access contacts and requirements for NEVDIS and TCA
- Explicit limits — the agent will not speculate outside this knowledge base

**To update the agent's knowledge:** edit `system-prompt.txt`, then update the prompt in the Power Automate flow's AI Builder step.

---

## Open/Close Buttons

The agent panel is opened by three buttons on the home page:

| Element ID | Location |
|------------|----------|
| `au-agent-open-hero` | Hero section (AI Assistant button) |
| `au-agent-open-banner` | AI Agent banner at the bottom of the page |
| `au-agent-open` | Navigation bar (AI Assistant link) — Power Pages nav only |

All buttons use `onclick="window.auAgent&&window.auAgent.open()"`.

---

## User Personalisation

The agent greets the logged-in user by first name. The name is injected via a Liquid tag on the panel element:

```html
data-user="{{ user.firstname | default: '' }}"
```

`home.js` reads this attribute at open time. If the Liquid tag is unrendered (e.g. local preview), it falls back gracefully to a generic greeting.

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Response takes > 8 seconds | "Still thinking… responses can take up to 15 seconds" hint appears |
| Request times out (22s) | Automatic single retry with the same message |
| Second timeout | "The assistant timed out. Please try again." error message |
| Non-timeout error (4xx/5xx) | "The assistant is temporarily unavailable. Please contact nevdis@austroads.com.au." |

---

## Power Pages Implementation Notes

These lessons were learned during development and are critical for any future work on this feature.

### CSS transform stacking context
Power Pages injects page content into a CSS-transformed ancestor element. Any `position: fixed` child of a transformed element is positioned relative to that ancestor — not the viewport — so it renders inline instead of as a full-screen overlay.

**Fix:** `home.js` calls `document.body.appendChild(panel)` on first open. Moving the panel to be a direct child of `<body>` escapes the transform and restores correct `position: fixed` behaviour.

### Event listener reliability
Power Pages may re-render the page content area after the initial load. Element-level `addEventListener` calls made at `DOMContentLoaded` can be lost if the DOM node is replaced.

**Fix:** All open/close triggers use `onclick` attributes in the HTML (evaluated at click time, not at load time) plus a `document`-level delegation handler as a secondary fallback:
```html
onclick="window.auAgent&&window.auAgent.open()"
```

### Bootstrap Offcanvas
Power Pages v2 (enhanced data model) includes Bootstrap 5, but does **not** load the full offcanvas CSS module. The Bootstrap JS toggle works (adds/removes `.show`) but without the CSS the panel renders inline with no fixed positioning.

**Decision:** Do not use Bootstrap Offcanvas for this feature. The current implementation uses a fully custom CSS overlay managed by `home.js`.

---

## Deployment

1. Edit source files in `austroads-power-pages/home/`
2. Copy to `austroads-power-pages-verify2/datahub---datahub/web-pages/home/`:
   - `Home.webpage.copy.html` ← `page-body.html`
   - `Home.webpage.custom_javascript.js` ← `home.js`
   - `Home.webpage.custom_css.css` ← `home.css`
   - Repeat for `content-pages/Home.en-US.*` equivalents
3. Run from inside `austroads-power-pages-verify2/`:
   ```
   pac pages upload --path "datahub---datahub" --environment "https://datahub-austroads.crm6.dynamics.com/" --modelVersion 2
   ```

---

## Production Considerations

These items are deferred post-POC:

- Replace `Access-Control-Allow-Origin: *` with the specific Power Pages domain in the PA Response action
- Add an IP restriction or shared secret header to the Power Automate HTTP trigger to prevent unauthorised calls
- Consider passing conversation history in the request body for multi-turn context
- Rate limiting — AI Builder has per-flow limits; add a retry/queue mechanism for high traffic
