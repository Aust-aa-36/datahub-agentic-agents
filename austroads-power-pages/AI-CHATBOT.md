# AI Chatbot — Technical Reference

> Data Hub Assistant: a slide-out chat drawer powered by Power Automate + AI Builder + Dataverse
> Last updated: 4 March 2026 (Iteration 16 — 7 enhancements)

---

## 1. Overview

The AI chatbot is a **slide-out drawer panel** on the home page that lets authorised users ask questions about NEVDIS and TCA data products. It uses a **multi-agent router** architecture — a classifier AI routes questions to domain-specific specialists that answer with knowledge pulled from Dataverse at runtime.

### Key Stats

| Metric | Value |
|--------|-------|
| Architecture | Router + 3 Specialists (multi-agent) |
| Backend | Power Automate (cloud flow) + AI Builder (GPT) |
| Knowledge base | 22 Dataverse articles + 111 field definitions |
| Conversation memory | Last 8 messages (4 exchanges) |
| Response time | 5–15 seconds typical |
| Client timeout | 45 seconds (auto-retry on first timeout) |

---

## 2. User Experience Flow

```
User clicks hero search bar or AI button
    → Drawer slides in from the right (460px wide)
    → Welcome message + 4 suggestion chips displayed
    → User types a question or clicks a chip
    → Typing indicator with animated dots appears
    → After 12s, "Still thinking..." hint shows
    → Bot response appears with domain badge (NEVDIS/TCA/AUSTROADS)
    → Bot responses render markdown (headers, lists, bold, code)
    → Conversation continues with full history context
```

### Entry Points

| Element | Location | Trigger |
|---------|----------|---------|
| Hero search bar | Home page hero section | `onclick="window.auAgent&&window.auAgent.open()"` |
| `window.auAgent.open()` | Global JS API | Can be called from anywhere |

---

## 3. Frontend Architecture

### Why the panel is built in JavaScript (not HTML)

Power Pages wraps all page content inside a CSS-transformed ancestor element (`transform: translate3d()`). This **breaks `position:fixed`** for any descendant — a fixed-position drawer inside the page content would scroll with the page instead of staying anchored to the viewport.

**Solution:** The entire panel is built as a DOM tree in JavaScript and appended directly to `document.body`, which sits outside the transformed wrapper. This lets `position:fixed` work correctly.

```
document.body                          ← Panel lives HERE (position:fixed works)
├── #au-agent-backdrop                 ← Semi-transparent overlay
├── #au-agent-panel                    ← The drawer itself
└── Power Pages wrapper (has CSS transform)
    └── <main id="main-content">       ← Page content lives here
        └── Hero search bar, etc.
```

### Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `home/home.js` | Panel construction, chat logic, API calls, markdown renderer, feedback, citations, export | ~500 |
| `home/home.css` | Panel styles, chat bubbles, typing indicator, suggestions, action bar, citations, export | ~490 |
| `home/page-body.html` | Hero search bar HTML (the only HTML for the chatbot) | Line 20–29 |

### DOM Structure (built by `buildPanel()`)

```html
<!-- Appended to document.body by JavaScript -->
<div id="au-agent-backdrop"></div>

<div id="au-agent-panel" role="dialog" aria-modal="true">
  <div class="au-agent-panel-body">

    <!-- Header bar (dark background, bot avatar, new-convo + close buttons) -->
    <div class="au-agent-section__header">
      <div class="au-agent-bot-avatar"><!-- Bot SVG --></div>
      <div class="au-agent-section__header-meta">
        <div class="au-agent-section__title">Data Hub Assistant</div>
        <div class="au-agent-section__status">
          <span class="au-agent-status-dot"></span>
          Online · NEVDIS & TCA
        </div>
      </div>
      <button class="au-agent-section__new" id="au-agent-new"><!-- Refresh SVG --></button>
      <button class="au-agent-section__close" id="au-agent-close"><!-- X SVG --></button>
    </div>

    <!-- Chat messages area (scrollable) -->
    <div class="au-agent-chat" id="au-agent-chat">
      <div class="au-agent-chat-inner" id="au-agent-chat-inner">
        <!-- Welcome message -->
        <div class="au-agent-msg au-agent-msg--bot">
          <div class="au-msg-bot-avatar"><!-- Bot SVG --></div>
          <div class="au-msg-bubble">Hi! I'm the Data Hub Assistant...</div>
        </div>
        <!-- Suggestion chips -->
        <div class="au-agent-suggestions">
          <button class="au-suggestion-chip">What is NEVDIS?</button>
          <button class="au-suggestion-chip">How do I access TCA data?</button>
          <button class="au-suggestion-chip">What is Plate-to-VIN?</button>
          <button class="au-suggestion-chip">What TCA services are available?</button>
        </div>
      </div>
    </div>

    <!-- Input bar (form + export footer) -->
    <div class="au-agent-input-wrap">
      <form class="au-agent-input-row" id="au-agent-form">
        <input type="text" id="au-agent-input" placeholder="Ask about NEVDIS, TCA..." maxlength="500">
        <button type="submit" id="au-agent-send-btn" disabled><!-- Arrow SVG --></button>
      </form>
      <div class="au-agent-input-footer">
        <div class="au-agent-input-hint">Powered by AI Builder</div>
        <button class="au-agent-export-btn" id="au-agent-export">Export</button>
      </div>
    </div>

  </div>
</div>
```

### Event Handling Strategy

Power Pages can re-render page content at any time, which **detaches** event listeners bound to specific elements. Two strategies are used:

| Strategy | Where | Why |
|----------|-------|-----|
| **Inline `onclick`** | Hero search bar in `page-body.html` | Evaluated at click time — survives DOM re-renders |
| **Document-level delegation** | `document.addEventListener('click', ...)` in `home.js` | Catches clicks on `#au-agent-close`, `#au-agent-backdrop`, suggestion chips |

**Critical rule:** Never use BOTH inline `onclick` AND document delegation on the same element. The `onclick` fires first (opens panel), then the event bubbles to the document handler which sees the panel is open and closes it — net result is the panel flashes open/closed invisibly.

### `window.auAgent` Global API

Set up immediately when `home.js` loads (before DOM ready):

```javascript
window.auAgent = {
  open:   function () { openPanel(); },
  close:  function () { closePanel(); },
  toggle: function () { /* checks classList, opens or closes */ }
};
```

This global is what inline `onclick` handlers call. It's available from the moment the script loads, regardless of DOM state.

### Personalisation

The panel reads the user's first name from a hidden Liquid element:

```html
<!-- In page-body.html (inside <main>) -->
<span id="au-user-data"
      data-first-name="{{ user.firstname | default: '' }}"
      style="display:none" aria-hidden="true"></span>
```

- If Liquid renders a name → welcome message says "Hi Aaron!"
- If the `{{` template syntax is still present (not rendered) → falls back to "Hi!"
- User's initials are shown in the user message avatar bubble

---

## 4. Backend Architecture — Power Automate

### Request/Response Contract

**Request** (POST to Power Automate HTTP trigger):

```json
{
  "message": "What is Plate-to-VIN?",
  "sessionId": "datahub-1709561234567",
  "history": [
    { "role": "user", "text": "Hello" },
    { "role": "bot",  "text": "Hi! How can I help?" }
  ]
}
```

**Response:**

```json
{
  "reply": "Plate-to-VIN (P2V) is a secure API service that converts...",
  "domain": "NEVDIS",
  "intent": "asking about plate-to-VIN service"
}
```

### Multi-Agent Router Flow

```
┌──────────────────────────────┐
│  Browser: home.js            │
│  fetch(AGENT_ENDPOINT, POST) │
│  { message, sessionId,      │
│    history[last 8 messages] } │
└──────────────┬───────────────┘
               │ HTTPS POST
               ▼
┌──────────────────────────────┐
│  Power Automate              │
│  HTTP Trigger (POST)         │
│  Parses message + history    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Build Conversation Context  │
│  Select → Join history[]     │
│  into "user: ...\nbot: ..."  │
│  text block                  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  AI Builder #1 — ROUTER      │
│  (router-prompt.txt)         │
│  Classifies intent:          │
│  → { "domain": "NEVDIS",    │
│      "intent": "..." }       │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Parse JSON + Error Fallback │
│  Default → GENERAL on fail   │
└──────────────┬───────────────┘
               │
        ┌──────┼──────────┐
        ▼      ▼          ▼
   ┌────────┐┌────────┐┌──────────┐
   │ NEVDIS ││  TCA   ││ GENERAL  │  ← Switch on domain
   │        ││        ││          │
   │ List   ││ List   ││ List     │  Dataverse: au_knowledge_article
   │ rows   ││ rows   ││ rows     │  (filtered by domain + status=Active)
   │ d=1    ││ d=2    ││ d=3      │
   │        ││        ││          │
   │ AI #2  ││ AI #2  ││ AI #2    │  Specialist prompt + knowledge rows
   └───┬────┘└───┬────┘└────┬─────┘
       └─────────┼──────────┘
                 ▼
┌──────────────────────────────┐
│  Response (HTTP 200)          │
│  { reply, domain, intent }   │
│  Headers:                    │
│    Content-Type: json        │
│    Access-Control-Allow-     │
│    Origin: *                 │
└──────────────────────────────┘
```

### Why Router + Specialists?

A single prompt containing all 17 products exceeds comfortable token limits and produces unfocused answers. The router classifies intent first (fast, small prompt), then only the relevant domain's knowledge is loaded. This keeps each AI Builder call focused and within the ~4,000 token input limit.

---

## 5. AI Prompts

### Router Prompt (`router-prompt.txt`)

The router's only job is to classify the user message into **NEVDIS**, **TCA**, or **GENERAL** and return a JSON object. It receives:
- The product directory (which products belong to which domain)
- Category classification (Data Elements vs Data Products)
- Conversation context (last few exchanges for follow-up questions)
- The current user message

Output: `{"domain":"NEVDIS","intent":"asking about plate-to-VIN access requirements"}`

### Specialist Prompts

Each specialist prompt has 3 placeholders replaced at runtime by Power Automate:

| Placeholder | Source | Content |
|-------------|--------|---------|
| `{knowledge}` | Dataverse `au_knowledge_article` rows | Structured text blocks with title, category, delivery method, source, summary, detail, process steps, access info |
| `{conversationContext}` | Last 4 exchanges from `history[]` | Formatted as `"user: ...\nbot: ..."` |
| `{message}` | Current user question | Raw text |

| Prompt File | Domain | Products Covered | Contact |
|-------------|--------|-----------------|---------|
| `nevdis-specialist-prompt.txt` | NEVDIS | 10 products (vehicles-reg through rav) | nevdis@austroads.com.au |
| `tca-specialist-prompt.txt` | TCA | 7 products (ems through nz) | support@tca.gov.au |
| `general-specialist-prompt.txt` | General | Cross-domain, overview, access | Both contacts |

---

## 6. Dataverse Knowledge Base

### `au_knowledge_article` (22 rows)

| Column | Type | Purpose |
|--------|------|---------|
| `au_title` | String(200) | Article title |
| `au_domain` | Choice (1=NEVDIS, 2=TCA, 3=General) | Domain routing |
| `au_product_name` | String(100) | Slug (e.g. "p2v") |
| `au_category` | Choice (1=Element, 2=Product, 3=General) | Data classification |
| `au_summary` | Text(2000) | Short description |
| `au_detail` | Text(10000) | Full knowledge content + condensed field summaries |
| `au_access_info` | Text(2000) | Access/eligibility/contact info |
| `au_data_source` | String(500) | Where data comes from |
| `au_delivery_method` | String(500) | How data is delivered |
| `au_update_frequency` | Choice (1–7) | Refresh cadence |
| `au_process_steps` | Text(4000) | Numbered process steps |
| `au_contact_email` | String(200) | Primary contact |
| `au_status` | Choice (1=Active, 2=Draft, 3=Archived) | Content lifecycle |

### `au_product_field` (111 rows)

Child table with a many-to-one lookup to `au_knowledge_article`. Stores individual input/output field definitions for each product (e.g. "VIN / Chassis Number", type: String, direction: Input).

### Knowledge Injection (current POC approach)

Condensed field summaries are baked into the `au_detail` text of each article:

```
"Key fields: VIN (String), Make (String), Model (String),
Body Type (String), Plate Number (String), Status (String),
Registration Start (Date), Registration Expiry (Date)."
```

The "List rows" action returns `au_detail` — specialists get field info with no extra query. The full `au_product_field` table exists for future per-product injection when more granular field-level answers are needed.

---

## 7. Chat Features

### Markdown Rendering

Bot responses are rendered through a lightweight markdown-to-HTML parser in `home.js`:

| Markdown | Rendered As |
|----------|------------|
| `## Header` | `<h5 class="au-md-h">` |
| `**bold**` | `<strong>` |
| `*italic*` | `<em>` |
| `` `code` `` | `<code>` |
| `- item` | `<ul class="au-md-list"><li>` |
| `1. item` | `<ol class="au-md-list"><li>` |

All content is **XSS-safe** — HTML entities are escaped before any markdown parsing.

### Domain Badges

Every bot response includes a coloured pill badge indicating which knowledge domain answered:

| Domain | Badge Text | Colour |
|--------|-----------|--------|
| NEVDIS | `NEVDIS` | Orange (`#CC4C00`) |
| TCA | `TCA` | Teal (`#2789AF`) |
| GENERAL | `AUSTROADS` | Charcoal (`#3C3533`) |

### Conversation History

The client sends the last 8 messages (4 user + 4 bot) with each request. This allows:
- The **router** to understand follow-up questions (e.g. "How do I access it?" after asking about P2V)
- The **specialists** to maintain context across turns

History is built client-side in `chatHistory[]` and sliced to the last 8 entries before each API call.

### Typing Indicator

- Animated bouncing dots appear immediately when a message is sent
- After 12 seconds, a "Still thinking... responses can take up to 15 seconds" hint fades in
- On first timeout (45s), the request automatically retries once
- On second timeout, an error message is shown with a suggestion to try again

### Keyboard Support

| Key | Action |
|-----|--------|
| Enter | Send message (via form submit) |
| Escape | Close the panel |

### Feedback (Thumbs Up/Down)

Each bot message has an **action bar** that fades in on hover with three buttons:

| Button | Icon | Behaviour |
|--------|------|-----------|
| Thumbs up | 👍 (SVG) | Toggles orange selected state; deselects thumbs down; logs to console |
| Thumbs down | 👎 (SVG) | Toggles orange selected state; deselects thumbs up; logs to console |
| Copy | Clipboard (SVG) | Copies raw text to clipboard; shows green checkmark for 2s |

Action bar uses event delegation on `chatInner` — no per-button listeners to leak. Feedback is POC (console.log) with a TODO for backend endpoint.

### Copy Message

Uses `navigator.clipboard.writeText()` with the raw text stored in `data-raw-text` attribute on the bubble element. Falls back gracefully if Clipboard API is unavailable.

### New Conversation

The refresh icon button in the panel header (`#au-agent-new`) calls `resetConversation()`:
- Clears `chatHistory[]` array
- Regenerates `SESSION_ID` with new timestamp
- Removes all messages from the DOM
- Rebuilds the welcome message (with personalised name) and suggestion chips
- Scrolls to top and focuses the input

### Source Citations

After each bot response is rendered, `addSourceCitations()` scans the raw text for product keywords using `PRODUCT_MAP` (30 keyword-to-slug mappings covering all 17 products). If matches are found, a "Related pages:" section is appended to the bubble with pill-shaped links to `/detail-{slug}`.

Links open in a new tab and are styled consistently with suggestion chips (orange-tinted pills, fill on hover).

### Conversation Export

The "Export" button in the input footer (`#au-agent-export`) calls `exportConversation()`:
- Serialises `chatHistory[]` to plain text with header (session ID, timestamp), role labels, and separators
- Downloads via `Blob` + `URL.createObjectURL` + programmatic click
- Filename: `datahub-chat-YYYY-MM-DD.txt`
- Gracefully warns in console if chat is empty

### User Context

The request body now includes a `user` object with `firstName`, `fullName`, and `email` — read from Liquid-rendered `data-*` attributes on a hidden span:

```html
<span id="au-user-data"
      data-first-name="{{ user.firstname }}"
      data-full-name="{{ user.fullname }}"
      data-email="{{ user.emailaddress1 }}"
      style="display:none"></span>
```

Each value is checked for unrendered `{{ }}` syntax (same guard as existing firstName logic). The Power Automate flow schema is backward-compatible — the `user` object is optional.

---

## 8. Styling

### Panel Dimensions

| Property | Value |
|----------|-------|
| Width | 460px (100vw on mobile) |
| Height | 100vh |
| Position | `fixed`, right-aligned |
| Z-index | 1055 (backdrop: 1054) |
| Background | `#F5F0E8` (warm off-white) |
| Animation | `translateX(100%)` → `translateX(0)` over 320ms cubic-bezier |

### Chat Bubbles

| Element | Style |
|---------|-------|
| Bot bubble | White background, subtle border, rounded (4px top-left, 14px others) |
| User bubble | Navy background (`--au-navy`), white text, rounded (14px top-left, 4px top-right) |
| Bot avatar | 26px circle, orange-to-brown gradient, bot SVG icon |
| User avatar | 26px circle, mid-navy, user's initial letter |

### Hero Search Bar

The hero search bar is a **fake input** — a styled `<div>` that looks like a text input but is actually a button that opens the drawer. This avoids duplicate input handling (the real input is inside the drawer).

```
┌──────────────────────────────────────────────┐
│ [Bot Icon]  Ask about NEVDIS, TCA, data...  [→] │
└──────────────────────────────────────────────┘
     ↑              ↑                          ↑
  Gradient      Placeholder text          Send arrow
  avatar        (muted, non-editable)     (decorative)
  (40px)                                  (36px)
```

Hover effect: border glows orange, slight upward lift, send button changes colour.

---

## 9. Error Handling

| Scenario | Client Behaviour |
|----------|-----------------|
| HTTP error (4xx/5xx) | "The assistant is temporarily unavailable" message |
| First timeout (45s) | Auto-retry with `showSlowHint()` |
| Second timeout | "The assistant timed out. Please try again" message |
| Empty reply from API | Treated as error, shows unavailable message |
| Network failure | Caught by `.catch()`, shows unavailable message |
| AI Builder rate limit (429) | Handled as HTTP error |
| Router JSON parse failure | Power Automate falls back to GENERAL domain |

---

## 10. Power Pages Gotchas

These are hard-won lessons from building a chat panel inside Power Pages:

| Problem | Root Cause | Solution |
|---------|-----------|----------|
| `position:fixed` doesn't work | Power Pages CSS transform ancestor | Build panel in JS, append to `document.body` |
| Event listeners disappear | Power Pages re-renders page content | Use inline `onclick` or document-level delegation |
| Panel opens then immediately closes | Inline `onclick` + document delegation conflict | Never use both on the same element |
| HTML outside `</main>` is ignored | Power Pages only renders content inside `<main>` | Keep all page HTML inside `<main>`, build panel in JS |
| CSS from web files doesn't load | Power Pages doesn't reliably serve `.css` web files | Inline all CSS in the web template `<style>` block |
| Old content after deploy | Portal cache serves stale content | Sync at make.powerpages.microsoft.com + Ctrl+Shift+R |
| Liquid `{{ }}` appears as literal text | User not logged in, or Liquid not rendering | Check for `{{` in JS before using the value |

---

## 11. File Reference

### Source Files (edit here)

```
austroads-power-pages/
├── home/
│   ├── home.js              ← All chat logic: panel build, API calls, markdown, history
│   ├── home.css             ← All chat styles: panel, bubbles, typing, input, badges
│   └── page-body.html       ← Hero search bar HTML + hidden user data span
└── agent-skill/
    ├── router-prompt.txt              ← Router classification prompt
    ├── nevdis-specialist-prompt.txt   ← NEVDIS specialist prompt
    ├── tca-specialist-prompt.txt      ← TCA specialist prompt
    ├── general-specialist-prompt.txt  ← General/Austroads specialist prompt
    ├── knowledge-seed-data-v2.json    ← 22 articles with all metadata
    ├── product-fields-seed-data.json  ← 111 field definitions
    └── power-automate-flow.md         ← Step-by-step flow setup guide
```

### Deploy Paths (copy to here, then PAC CLI upload)

```
austroads-power-pages-verify2/datahub---datahub/
├── web-pages/home/
│   ├── Home.webpage.copy.html                              ← page-body.html
│   ├── Home.webpage.custom_javascript.js                   ← home.js
│   ├── Home.webpage.custom_css.css                         ← home.css
│   └── content-pages/
│       ├── Home.en-US.webpage.copy.html                    ← page-body.html (duplicate)
│       ├── Home.en-US.webpage.custom_javascript.js         ← home.js (duplicate)
│       └── Home.en-US.webpage.custom_css.css               ← home.css (duplicate)
└── web-templates/austroads-layout/
    └── Austroads-Layout.webtemplate.source.html             ← Inlined CSS (includes chat styles)
```

### Deployment Steps

1. Edit source files in `austroads-power-pages/home/`
2. Copy to **both** paths in `austroads-power-pages-verify2/` (web-pages + content-pages)
3. Run PAC CLI: `pac pages upload --path "datahub---datahub" --environment "https://datahub-austroads.crm6.dynamics.com/" --modelVersion 2`
4. Sync portal cache: make.powerpages.microsoft.com → Sync → wait 30s → Ctrl+Shift+R

---

## 12. Testing

### Manual Test Cases

| Test | Expected |
|------|----------|
| Click hero search bar | Drawer slides in, input focused |
| Click backdrop | Drawer closes |
| Press Escape | Drawer closes |
| Type "What is P2V?" + Enter | NEVDIS badge, describes Plate-to-VIN |
| Click "How do I access TCA data?" chip | TCA badge, describes access process |
| Type "Hello" | AUSTROADS badge, greeting response |
| Ask follow-up "How do I access it?" after a NEVDIS question | NEVDIS badge (router uses history context) |
| Wait 12s for slow response | "Still thinking..." hint appears |
| Send when offline | Error message shown gracefully |

### Power Automate Test

POST to the flow URL with:

```json
{
  "message": "What inputs does P2V need?",
  "sessionId": "test-001",
  "history": []
}
```

Expected: `{ "reply": "...", "domain": "NEVDIS", "intent": "..." }`

---

*Internal POC — Austroads Data Info Hub — For Authorised Users Only*
