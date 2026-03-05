# Austroads Data Info Hub — Architecture & Design

> POC built on Microsoft Power Pages + Power Automate + AI Builder + Dataverse
> Last updated: 4 March 2026

---

## 1. Executive Summary

The **Austroads Data Info Hub** is a proof-of-concept internal portal for authorised users to discover, understand, and request access to Austroads' national data products.

It covers two national data programmes:

| Programme | Full Name | Scope | Products |
|-----------|-----------|-------|----------|
| **NEVDIS** | National Exchange of Vehicle and Driver Information System | Vehicle registration, VINs, driver licences, stolen vehicles, safety recalls | 10 products |
| **TCA** | Transport Certification Australia | Heavy vehicle telematics, GNSS telemetry, freight routes, on-board mass | 7 products |

The hub includes an **AI-powered assistant** that uses a multi-agent router architecture to answer questions about any product with structured, factual responses drawn from a Dataverse knowledge base.

---

## 2. Site Architecture

### Platform Stack

```
┌─────────────────────────────────────────────────────┐
│                    Browser (User)                    │
├─────────────────────────────────────────────────────┤
│              Microsoft Power Pages                   │
│         (Web Templates + Liquid + HTML/JS)           │
├──────────────┬──────────────┬────────────────────────┤
│   Dataverse  │ Power        │  AI Builder            │
│   (Tables)   │ Automate     │  (GPT Prompts)         │
│              │ (Flows)      │                        │
└──────────────┴──────────────┴────────────────────────┘
```

### Key Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Power Pages (HTML/CSS/JS) | 20-page portal with responsive layout |
| Layout | Web Template (Liquid) | Shared header, footer, nav — CSS inlined in `<style>` block |
| Data Layer | Dataverse | Knowledge articles (22 rows) + product fields (111 rows) |
| AI Agent | Power Automate + AI Builder | Multi-agent router with 3 specialist prompts |
| Auth | Power Pages Identity | Internal staff access via Entra ID |

---

## 3. Page Inventory (20 Pages)

### Home & Catalogues

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Hero, product highlights, AI assistant button, stats |
| NEVDIS Catalogue | `/nevdis` | All 10 NEVDIS product cards |
| TCA Catalogue | `/tca` | All 7 TCA product cards |

### NEVDIS Detail Pages (10)

| # | Product | Slug | Category | Update Frequency |
|---|---------|------|----------|-----------------|
| 1 | Vehicles & Registrations | `vehicles-reg` | Data Element | Real-time |
| 2 | National VIN Database | `natvin` | Data Element | Real-time |
| 3 | Driver Licences | `driver` | Data Element | Real-time |
| 4 | Stolen & Write-off (SWOVS) | `stolen` | Data Element | Real-time |
| 5 | Vehicles Gold Data | `gold` | Data Element | Periodic |
| 6 | Plate-to-VIN (P2V) | `p2v` | Data Product | Real-time |
| 7 | Safety Recalls | `recall` | Data Product | Real-time |
| 8 | AEC Data Provisioning | `aec` | Data Product | Daily |
| 9 | BITRE Motor Vehicle Census | `bitre` | Data Product | Annual |
| 10 | Enabling RAV | `rav` | Data Product | Real-time |

### TCA Detail Pages (7)

| # | Product | Slug | Category | Update Frequency |
|---|---------|------|----------|-----------------|
| 1 | Vehicle Enrolment Data (EMS) | `ems` | Data Element | Real-time |
| 2 | Spatiotemporal Data | `spatiotemporal` | Data Element | Real-time |
| 3 | Spatial Data Services (IAC/B2B) | `spatial` | Data Element | Periodic |
| 4 | Road Analytics Services | `road-analytics` | Data Product | Monthly |
| 5 | Smart OBM Data Services | `smart-obm` | Data Product | Periodic |
| 6 | High Productivity Freight Routes | `hpfr` | Data Product | Annual |
| 7 | New Zealand — Historical Study | `nz` | Data Product | Static |

---

## 4. Design System

### Colour Palette (Austroads Style Guide 2021)

```
Brand Palette (from Austroads Style Guide 2021)
─────────────────────────────────────────────────
  Pitch (Primary)    #3C3533   ████  Headers, text, user bubbles (Pantone Black 7)
  Pitch Dark         #2D2624   ████  Panel header, dark accents
  Pitch Mid          #564A47   ████  Secondary text, borders
  Web Colour         #CC4C00   ████  Interactive elements, links (Pantone 718)
  Primary Brand      #F36F21   ████  CTA buttons, highlights (Pantone 166)
  Cream (Background) #FAF7F2   ████  Page background
  Beige (Subtle)     #F0EBE3   ████  Card backgrounds, input fields

Domain Brands
─────────────────────────────────────────────────
  NEVDIS             #CC4C00   ████  Orange (cards, badges, hovers) — Pantone 718
  TCA                #2789AF   ████  Teal (cards, badges, hovers) — TCA Colour Palette
  Austroads/General  #3C3533   ████  Pitch/charcoal (general knowledge badge)
  AI Assistant        Purple   ████  #7C3AED → #4F46E5 gradient
```

### Typography

| Usage | Font | Weights | Source |
|-------|------|---------|--------|
| Headings (`--font-display`) | Roboto Slab | 400, 500, 600, 700 | Google Fonts (per Style Guide — web typeface) |
| Body (`--font-body`) | Arial | Regular system font | System font (per Style Guide — publication typeface) |

### Section Theming

Adding `nevdis-section` or `tca-section` class to a `<section>` wrapper automatically re-themes all child components:

- Card hover bars and icons
- Tag/chip colours
- Section header accent bar
- "See all" link colour

---

## 5. AI Agent Architecture

### Evolution: v1 → v2

| Version | Architecture | Limitations |
|---------|-------------|-------------|
| **v1** | Single AI Builder call with monolithic prompt | No domain routing, all products in one prompt, no Dataverse lookup |
| **v2** (current) | Router → Specialist pattern with Dataverse knowledge injection | Domain-aware, structured metadata, conversation history |

### v2 Multi-Agent Router Flow

```
┌──────────────────────┐
│  User types message   │
│  in chat panel        │
└──────────┬───────────┘
           │ POST { message, sessionId, history[], user }
           ▼
┌──────────────────────┐
│  Power Automate      │
│  HTTP Trigger        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Build Conversation  │  Select + Join last 8 messages
│  Context             │  into text block
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  AI Builder #1       │  Router prompt classifies intent
│  ROUTER              │  → { "domain": "NEVDIS", "intent": "..." }
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Parse JSON          │  Extract domain + intent
│  + Error fallback    │  Default to GENERAL on failure
└──────────┬───────────┘
           │
     ┌─────┼──────────────┐
     ▼     ▼              ▼
┌────────┐┌────────┐┌──────────┐
│ NEVDIS ││  TCA   ││ GENERAL  │
│        ││        ││          │
│ List   ││ List   ││ List     │  Dataverse: au_knowledge_article
│ rows   ││ rows   ││ rows     │  (domain filter + status=Active)
│ d=1    ││ d=2    ││ d=3      │
│        ││        ││          │
│ AI #2  ││ AI #2  ││ AI #2    │  Specialist prompt + knowledge
└───┬────┘└───┬────┘└────┬─────┘
    └─────────┼──────────┘
              ▼
┌──────────────────────┐
│  Response            │  { reply, domain, intent }
│  + CORS headers      │  Access-Control-Allow-Origin: *
└──────────────────────┘
```

### Prompt Files

| File | Purpose | Key Content |
|------|---------|-------------|
| `router-prompt.txt` | Classifies intent → NEVDIS / TCA / GENERAL | Product directory, category list, JSON-only output |
| `nevdis-specialist-prompt.txt` | Answers NEVDIS product questions | 10 products, structured metadata, contact: nevdis@austroads.com.au |
| `tca-specialist-prompt.txt` | Answers TCA product questions | 7 products, structured metadata, contact: support@tca.gov.au |
| `general-specialist-prompt.txt` | Greetings, comparisons, general Austroads | Cross-domain guidance, both contact details |

Each specialist prompt has 3 placeholders replaced at runtime:

```
{knowledge}             ← Dataverse rows (formatted as structured text blocks)
{conversationContext}   ← Last 4 exchanges from chat history
{message}               ← Current user question
```

### Chat Panel Implementation

The agent chat panel is built entirely in JavaScript and appended to `document.body` — this is required because Power Pages wraps page content in a CSS-transformed ancestor that breaks `position:fixed`.

| Feature | Implementation |
|---------|---------------|
| Panel position | `document.body.appendChild()` — escapes Power Pages CSS transform |
| Open/close | `window.auAgent` global + inline `onclick` on buttons |
| Event handling | Document-level delegation (survives Power Pages DOM re-renders) |
| Conversation history | Last 8 messages sent with each request for context |
| Markdown rendering | Lightweight parser: headers, bold, lists, inline code → HTML |
| Domain badges | Orange pill (NEVDIS), teal pill (TCA), charcoal pill (AUSTROADS/general) |
| Typing indicator | Animated dots + "Still thinking..." after 12s |
| Timeout | 45s client-side, with automatic retry on first timeout |
| User context | Full name + email sent in POST body (from Liquid data attributes) |
| Feedback | Thumbs up/down action bar on bot messages (hover to reveal) |
| Copy | Clipboard copy of raw text; visual checkmark feedback |
| New conversation | Reset button clears history, regenerates session ID |
| Source citations | Auto-detected product mentions linked to detail pages |
| Export | Download chat history as plain text file |

---

## 6. Dataverse Data Model

### Entity Relationship

```
┌──────────────────────────────────────┐
│       au_knowledge_article           │
│  (22 rows — 10 NEVDIS, 7 TCA, 5 Gen)│
├──────────────────────────────────────┤
│  au_title              (String 200)  │
│  au_domain             (Choice 1-3)  │◄── 1 = NEVDIS, 2 = TCA, 3 = General
│  au_product_name       (String 100)  │    Slug e.g. "p2v"
│  au_category           (Choice 1-3)  │◄── 1 = Data Element, 2 = Data Product
│  au_summary            (Text 2000)   │
│  au_detail             (Text 10000)  │    Includes key-fields summary
│  au_access_info        (Text 2000)   │
│  au_data_source        (String 500)  │
│  au_delivery_method    (String 500)  │
│  au_update_frequency   (Choice 1-7)  │◄── Real-time, Daily, Monthly, etc.
│  au_process_steps      (Text 4000)   │    Numbered process steps
│  au_contact_email      (String 200)  │
│  au_keywords           (String 500)  │
│  au_status             (Choice 1-3)  │◄── Active, Draft, Archived
└───────────────┬──────────────────────┘
                │
                │  1 : Many (Lookup)
                │
┌───────────────┴──────────────────────┐
│        au_product_field              │
│   (111 rows across 17 products)      │
├──────────────────────────────────────┤
│  au_field_name         (String 200)  │    e.g. "VIN / Chassis Number"
│  au_field_type         (String 50)   │    String, Number, Date, Float, etc.
│  au_field_direction    (Choice 1-2)  │◄── 1 = Input, 2 = Output
│  au_field_group        (String 100)  │    e.g. "Vehicle Details"
│  au_field_description  (Text 1000)   │
│  au_field_example      (String 200)  │    e.g. "6T1BD3FK90X141096"
│  au_field_required     (Yes/No)      │
│  au_sort_order         (Number)      │
│  au_knowledge_article  (Lookup)      │◄── FK to parent article
└──────────────────────────────────────┘
```

### Data Distribution

| Domain | Articles | Fields | Products |
|--------|----------|--------|----------|
| NEVDIS | 10 | 74 | vehicles-reg, natvin, driver, stolen, gold, p2v, recall, aec, bitre, rav |
| TCA | 7 | 37 | ems, spatiotemporal, spatial, road-analytics, smart-obm, hpfr, nz |
| General | 5 | — | Cross-domain, overview, access guidance |
| **Total** | **22** | **111** | **17 product detail pages** |

### Knowledge Injection Strategy

**Current (Option A — POC):** Condensed field summaries are baked into `au_detail` text. Example:

```
"Key fields: VIN (String), Make (String), Model (String),
Body Type (String), Plate Number (String), Status (String),
Registration Start (Date), Registration Expiry (Date)."
```

The existing "List rows" call returns `au_detail` — specialists get field info with no extra query.

**Future (Option B):** Dynamic injection — router returns `{ domain, intent, product }`, flow queries `au_product_field` for that specific product, injects full field definitions. Avoids exceeding AI Builder's ~4,000 token input limit.

---

## 7. Deployment Workflow

### Pipeline

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────┐     ┌──────────────┐
│  Source of Truth  │────▶│  Deploy Folder    │────▶│  PAC CLI     │────▶│  Power Pages  │
│  austroads-       │     │  austroads-       │     │  Upload      │     │  (Live Site)  │
│  power-pages/     │     │  power-pages-     │     │              │     │              │
│                   │     │  verify2/         │     │              │     │              │
└──────────────────┘     └──────────────────┘     └──────────────┘     └──────────────┘
     Edit here              Copy files               Upload               Sync cache
```

### Step-by-Step

1. **Edit** source files in `austroads-power-pages/`
2. **Copy** changed files to matching paths in `austroads-power-pages-verify2/datahub---datahub/`
3. **Upload** via PAC CLI:
   ```
   cd austroads-power-pages-verify2/
   pac pages upload --path "datahub---datahub" \
     --environment "https://datahub-austroads.crm6.dynamics.com/" \
     --modelVersion 2
   ```
4. **Sync** portal cache: make.powerpages.microsoft.com → select site → Sync → wait 30s → Ctrl+Shift+R

### Dual-Copy Pattern

Power Pages requires files in two locations. Each changed file must be copied to both:

| File Type | Path 1 (web-pages) | Path 2 (content-pages) |
|-----------|-------------------|----------------------|
| Page JS | `web-pages/[page]/[Page].webpage.custom_javascript.js` | `web-pages/[page]/content-pages/[Page].en-US.webpage.custom_javascript.js` |
| Page CSS | `web-pages/[page]/[Page].webpage.custom_css.css` | `web-pages/[page]/content-pages/[Page].en-US.webpage.custom_css.css` |
| Page HTML | `web-pages/[page]/[Page].webpage.copy.html` | `web-pages/[page]/content-pages/[Page].en-US.webpage.copy.html` |

### CSS Delivery

The web template (`Austroads-Layout.webtemplate.source.html`) contains ALL CSS inlined in a `<style>` block. The `austroads.css` web file is **not loaded by the browser**. Any CSS change must be made in both:

1. `austroads-power-pages/shared/austroads.css` (source of truth)
2. The web template's inline `<style>` block (what actually renders)

---

## 8. Iteration History

### Iteration 1 — Initial Site Build
- 20-page Power Pages site (home, 2 catalogues, 17 detail pages)
- Shared CSS/JS design system (Barlow fonts, card components, responsive grid)
- Web template with Liquid layout (header, nav, footer)

### Iteration 2 — Theme Overhaul
- Colour palette updated: gold → orange (#E35205), blue → warm orange (#D4621A)
- Background: white → warm cream (#FAF7F2) and beige (#F0EBE3)
- Navy shifted to slate blue-grey (#3B4A5A)

### Iteration 3 — Logo & Branding
- Replaced JPEG logo (dark background) with transparent PNG from Brandfetch
- Logo encoded as inline base64 in web template `<img>` tag

### Iteration 4 — NEVDIS/TCA Brand Sections
- Added domain-specific colour tokens: NEVDIS orange, TCA green
- `nevdis-section` and `tca-section` CSS classes auto-theme child components
- Applied across home page, NEVDIS catalogue, and TCA catalogue

### Iteration 5 — AI Agent v1 (Monolithic)
- Chat drawer panel with slide-in animation
- Single AI Builder call with a static system prompt containing all products
- Panel built in JS and appended to `document.body` (Power Pages CSS fix)
- `window.auAgent` global for reliable button binding

### Iteration 6 — AI Agent v2 (Multi-Agent Router)
- Router AI Builder classifies intent → NEVDIS / TCA / GENERAL
- 3 specialist prompts replace single monolithic prompt
- Dataverse `au_knowledge_article` table (22 articles) replaces static prompt text
- Knowledge injected dynamically from Dataverse at runtime
- Conversation history (last 8 messages) sent for context
- Domain badges on responses (orange = NEVDIS, green = TCA)

### Iteration 7 — Knowledge Enrichment
- 6 new metadata columns on `au_knowledge_article`: category, data source, delivery method, update frequency, process steps, contact email
- New child table `au_product_field` with 111 field definitions (inputs + outputs)
- Router prompt updated with product directory and category classification
- Specialist prompts updated to use structured metadata for precise answers
- Knowledge text block enriched with category, delivery, source, process info

### Iteration 8 — Rich Response Rendering
- Lightweight markdown-to-HTML renderer in chat panel
- Bot responses now display formatted headers, bullet lists, numbered steps, bold text
- XSS-safe: HTML entities escaped before rendering

### Iteration 9 — Austroads Style Guide 2021 Alignment
- Colours aligned to official Austroads Style Guide 2021 PDF
- Navy/Pitch: `#3B4A5A` → `#3C3533` (Pantone Black 7), dark `#2E3A48` → `#2D2624`, mid `#4D6175` → `#564A47`
- Web colour: `#D4621A` → `#CC4C00` (Pantone 718)
- Primary brand: `#E35205` → `#F36F21` (Pantone 166)
- Fonts: Barlow family → **Roboto Slab** (headings, per Style Guide web spec) + **Arial** (body)
- All hardcoded `rgba()` values updated across austroads.css, web template, and home.css
- NEVDIS brand updated to match web colour (`#CC4C00`)

### Iteration 10 — TCA Colour Palette
- TCA section colours updated from forest green to teal per official TCA Colour Palette
- `--tca`: `#1A6E46` → `#2789AF` (mid teal), `--tca-mid`: `#2A8F5C` → `#126785` (dark teal)
- All TCA `rgba()` values updated across all CSS files
- TCA domain badge in agent chat updated to teal

### Iteration 11 — Austroads General Knowledge Badge
- Agent chat now shows a domain badge for all responses including general/Austroads knowledge
- GENERAL domain displays as **"AUSTROADS"** badge in charcoal/pitch (`#3C3533`)
- Three badge types: NEVDIS (orange), TCA (teal), AUSTROADS (charcoal)

### Iteration 12 — AI-First Hero Redesign

- Removed 4 hero buttons (Browse NEVDIS, Browse TCA, View Analytics Reports, AI Assistant)
- Replaced with a **pill-shaped AI search bar** in the hero — clicking opens the agent drawer
- Search bar is a "fake input" (clickable `<div>`) — avoids duplicate input handling; all chat logic stays in `home.js`
- Removed the AI Agent Banner section from the bottom of the home page
- Removed "AI" stat tile — now 3 stats (8 Jurisdictions, 13 NEVDIS products, 10 TCA services)
- Fixed dual-handler bug: inline `onclick` + document delegation were conflicting (open then immediately close)
- Removed `.au-agent-banner` CSS from `austroads.css` and web template

### Iteration 13 — Catalog & Search Cleanup

- Removed unstyled search bars from NEVDIS and TCA catalog pages (CSS was in page-specific files that don't load in Power Pages)
- Created `page-body.html` files for NEVDIS and TCA containing only `<main>` content (matching `home/page-body.html` pattern)
- Fixed duplicate header/footer on subpages caused by deploying full `index.html` (with `<!DOCTYPE>`, `<header>`, `<footer>`) instead of body-only content

### Iteration 14 — Home Page Layout Polish

- Unified NEVDIS section on home page to use `au-service-card` layout (matching TCA) instead of `au-card` tall cards
- Both sections now use `au-grid-service` grid with identical card structure and hover behaviour
- NEVDIS cards hover orange, TCA cards hover teal — both via section theming classes
- Increased section padding (`48px` → `56px`) and added `.au-section + .au-section` spacing
- Converted "Explore NEVDIS →" / "Explore TCA →" from text links to **branded buttons** — orange for NEVDIS, teal for TCA

### Iteration 15 — Catalog Card Unification & Tags

- Converted TCA catalog page from tall `au-card` layout to compact `au-service-card` layout (matching NEVDIS catalog)
- Added `au-service-card__tags` CSS component — flex-wrap tag row inside compact service cards
- Added data element tags to all NEVDIS catalog service cards (e.g. "Registration, Vehicles, Jurisdictions", "VIN, ADR, WMI", "Licence, Demerit Points, Conditions")
- All TCA catalog service cards retain existing tags (e.g. "GNSS, Telematics, Speed", "IAC, B2B, Geoscape")
- Both catalogs now have identical card structure: icon + title + description + tags
- Fixed NEVDIS section spacing on home page — removed `au-section--tight` class that was zeroing top padding

### Iteration 16 — AI Chatbot Enhancements (7 features)

Inspired by open-source chatbot frameworks ([assistant-ui](https://github.com/assistant-ui/assistant-ui), [React ChatBotify](https://github.com/tjtanjin/react-chatbotify), [Vectara React-Chatbot](https://github.com/vectara/react-chatbot)):

1. **User Context** — Full name and email (from Liquid `{{ user.fullname }}`, `{{ user.emailaddress1 }}`) sent with each request via `#au-user-data` data attributes → `user: {}` in POST body
2. **CORS Lockdown** (documented) — `Access-Control-Allow-Origin` should be restricted from `*` to `https://datahub.powerappsportals.com` (manual PA change)
3. **Thumbs Up/Down Feedback** — Action bar on each bot message with 👍/👎 buttons; fades in on hover; toggles selected state; console-logged (POC, backend-ready)
4. **Copy Message** — Clipboard button in action bar; copies raw text (not HTML); shows checkmark for 2s
5. **New Conversation** — Refresh icon in panel header; clears `chatHistory[]`, regenerates `SESSION_ID`, rebuilds welcome message + suggestion chips
6. **Source Citations** — Product mentions auto-detected via `PRODUCT_MAP` lookup (30 keywords → 17 slugs); citation pills link to `/detail-{slug}` pages
7. **Conversation Export** — Download button in input footer; serialises chat to `datahub-chat-YYYY-MM-DD.txt` via Blob + click-to-download

---

## 9. Key Technical Decisions

### Why is CSS inlined in the web template?

Power Pages does not reliably load `.css` web files. During development, we discovered that `austroads.css` uploaded as a web file was never reaching the browser. The only CSS that renders is the inline `<style>` block inside the web template. All CSS is maintained in both locations for source-of-truth consistency.

### Why is the agent panel built entirely in JavaScript?

Power Pages wraps page content inside a CSS-transformed ancestor element. This breaks `position:fixed` for any descendant. By building the panel in JS and appending it directly to `document.body`, we move it outside the transformed wrapper, allowing the slide-in drawer to work correctly.

### Why use inline `onclick` instead of `addEventListener`?

Power Pages may re-render page content at any time, detaching event listeners bound to specific elements. Inline `onclick="window.auAgent.open()"` is evaluated at click time and survives DOM re-renders. Document-level event delegation is used as a secondary mechanism.

### Why 2 Dataverse tables, not 3?

Product metadata (category, delivery method, frequency, etc.) has a 1:1 relationship with each product — it belongs as columns on the existing `au_knowledge_article` table. Only input/output field definitions are 1:many and warrant a separate child table (`au_product_field`). This avoids unnecessary joins and keeps the flow simple.

### Why bake field summaries into `au_detail` (Option A)?

AI Builder has an input token limit of ~4,000 tokens. Injecting all 111 field records for every query would exceed this. Instead, a condensed "Key fields: ..." summary is appended to each product's `au_detail` text (~80 extra tokens per product). The full field table exists in Dataverse for future per-product injection (Option B).

### Why a router + specialist pattern instead of a single prompt?

A single prompt containing all 17 products exceeds comfortable token limits and produces less focused answers. The router classifies intent first (fast, small prompt), then only the relevant domain's knowledge is loaded. This keeps each AI Builder call focused and within token budget.

---

## Appendix: File Structure

```
austroads-power-pages/                    ← Source of truth
├── home/
│   ├── page-body.html                    ← Home page HTML (Liquid)
│   ├── home.js                           ← Agent chat + panel logic
│   └── home.css                          ← Agent panel styles
├── nevdis/                               ← NEVDIS catalogue page
├── tca/                                  ← TCA catalogue page
├── detail-vehicles-reg/                  ← Product detail pages (x17)
├── detail-natvin/
├── detail-driver/
├── detail-stolen/
├── detail-gold/
├── detail-p2v/
├── detail-recall/
├── detail-aec/
├── detail-bitre/
├── detail-rav/
├── detail-ems/
├── detail-spatiotemporal/
├── detail-spatial/
├── detail-road-analytics/
├── detail-smart-obm/
├── detail-hpfr/
├── detail-nz/
├── shared/
│   ├── austroads.css                     ← Full design system (757 lines)
│   ├── austroads.js                      ← Shared nav, tabs, scroll (208 lines)
│   └── logo.png                          ← Transparent Austroads logo
└── agent-skill/
    ├── router-prompt.txt                 ← Router classification prompt
    ├── nevdis-specialist-prompt.txt      ← NEVDIS specialist prompt
    ├── tca-specialist-prompt.txt         ← TCA specialist prompt
    ├── general-specialist-prompt.txt     ← General specialist prompt
    ├── system-prompt.txt                 ← Legacy v1 prompt (reference)
    ├── knowledge-seed-data-v2.json       ← 22 articles with metadata
    ├── product-fields-seed-data.json     ← 111 field definitions
    └── power-automate-flow.md            ← Flow setup documentation

austroads-power-pages-verify2/            ← PAC CLI deploy folder
└── datahub---datahub/
    ├── web-templates/austroads-layout/   ← Main layout (inlined CSS)
    ├── web-pages/                        ← Page content for deployment
    └── content-snippets/                 ← Liquid snippets
```
