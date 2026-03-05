# Austroads Data Info Hub — Power Pages POC

## Site Structure

This package contains all pages for the Austroads Data Info Hub, structured for deployment to **Microsoft Power Pages**.

---

## Page Inventory

| Directory | URL / Page Name | Description |
|-----------|----------------|-------------|
| `home/` | `/` or `home` | Landing page with hero AI search bar, stats, NEVDIS + TCA highlights |
| `nevdis/` | `/nevdis` | NEVDIS catalog — all data elements and products |
| `tca/` | `/tca` | TCA catalog — all data elements and products |
| `detail-vehicles-reg/` | `/nevdis/vehicles-registrations` | Vehicles & Registrations Data |
| `detail-natvin/` | `/nevdis/national-vin-database` | National VIN Database |
| `detail-driver/` | `/nevdis/driver-licences` | Driver Licences |
| `detail-stolen/` | `/nevdis/stolen-writeoff-restrictions` | Stolen & Write-off Restrictions |
| `detail-gold/` | `/nevdis/vehicles-gold-data` | Vehicles Gold Data |
| `detail-p2v/` | `/nevdis/plate-to-vin` | Plate-to-VIN (P2V) |
| `detail-recall/` | `/nevdis/safety-recalls` | Safety Recalls |
| `detail-aec/` | `/nevdis/aec-data-provisioning` | AEC Data Provisioning |
| `detail-bitre/` | `/nevdis/bitre-motor-vehicle-census` | BITRE Motor Vehicle Census |
| `detail-rav/` | `/nevdis/enabling-rav` | Enabling RAV |
| `detail-ems/` | `/tca/vehicle-enrolment-ems` | Vehicle Enrolment Data (EMS) |
| `detail-spatiotemporal/` | `/tca/spatiotemporal-data` | Spatiotemporal Data (Position & Speed) |
| `detail-spatial/` | `/tca/spatial-data-services` | Spatial Data Services (IAC / B2B) |
| `detail-road-analytics/` | `/tca/road-analytics-services` | Road Analytics Services |
| `detail-smart-obm/` | `/tca/smart-obm-data-services` | Smart OBM Data Services |
| `detail-hpfr/` | `/tca/high-productivity-freight-routes` | High Productivity Freight Routes |
| `detail-nz/` | `/tca/new-zealand` | New Zealand |

**Total: 20 pages**

---

## Each Page Contains

Every page directory contains exactly:

```
page-name/
├── index.html   ← Page markup (references shared CSS/JS + page-specific files)
├── page.css     ← Page-specific styles
└── page.js      ← Page-specific JavaScript
```

Plus the shared assets used by all pages:

```
shared/
├── austroads.css   ← Full design system (tokens, components, layout)
├── austroads.js    ← Shared JS (mobile nav, tabs, search, animations, agent)
└── logo.png        ← Austroads logo
```

---

## Power Pages Deployment Guide

### Option A: Custom HTML Web Files
1. In the Power Pages design studio, create a new page for each directory
2. Add a **Custom HTML** component to each page
3. Copy the contents of `index.html` into the component
4. Upload `austroads.css` and `austroads.js` as Web Files
5. Update relative paths (`../shared/`) to Power Pages CDN/web file paths
6. Upload `logo.png` as a Web File

### Option B: Liquid + Web Templates
1. Create a **Web Template** in Power Pages for:
   - `layout-header` (header partial)
   - `layout-footer` (footer partial)
   - `layout-detail-page` (detail page template with tab support)
   - `layout-catalog-page` (catalog page template)
2. Copy CSS into Power Pages **Content Snippets** or Web Files
3. Copy JS into a Web File and reference via `{% include 'austroads_js' %}`
4. Use Liquid tags to inject page-specific content

### Recommended Path Variables for Power Pages
Update these references in each HTML file before deployment:

```html
<!-- Replace relative paths with Power Pages Web File paths -->
<link rel="stylesheet" href="~/webfiles/austroads.css">
<link rel="stylesheet" href="~/webfiles/[page-name].css">
<script src="~/webfiles/austroads.js"></script>
<script src="~/webfiles/[page-name].js"></script>
<img src="~/webfiles/logo.png" alt="Austroads">
```

---

## AI Agent (v2 — Multi-Agent Router)

The home page includes a **slide-out chat drawer** powered by Power Automate + AI Builder + Dataverse.

### Architecture

```
User message → Power Automate HTTP trigger
  → AI Builder #1 (Router) classifies domain: NEVDIS / TCA / GENERAL
  → Switch: queries Dataverse au_knowledge_article for that domain
  → AI Builder #2 (Specialist) answers with injected knowledge
  → Response { reply, domain, intent }
```

### Features

- **Multi-agent router**: Router classifies intent, specialist answers with domain knowledge
- **Dataverse knowledge base**: 22 articles + 111 field definitions injected at runtime
- **Markdown rendering**: Bot responses display formatted headers, lists, bold, code
- **Domain badges**: Orange pill (NEVDIS), teal pill (TCA), charcoal pill (AUSTROADS/general)
- **Conversation history**: Last 8 messages sent for context
- **Panel architecture**: Built entirely in JS, appended to `document.body` (escapes Power Pages CSS transform ancestor)
- **Hero entry point**: Pill-shaped AI search bar in the home hero — clicking opens the agent drawer

### Prompt Files

| File | Purpose |
|------|---------|
| `agent-skill/router-prompt.txt` | Classifies intent → NEVDIS / TCA / GENERAL |
| `agent-skill/nevdis-specialist-prompt.txt` | Answers NEVDIS product questions |
| `agent-skill/tca-specialist-prompt.txt` | Answers TCA product questions |
| `agent-skill/general-specialist-prompt.txt` | Greetings, comparisons, general Austroads |

---

## Design System

Colours aligned to the **Austroads Style Guide 2021** and **TCA Colour Palette**:

| Token | Value | Usage |
|-------|-------|-------|
| `--au-navy` | `#3C3533` | Pitch (Pantone Black 7) — headers, text, user bubbles |
| `--au-navy-dark` | `#2D2624` | Dark pitch — panel header, dark accents |
| `--au-navy-mid` | `#564A47` | Mid pitch — secondary text, borders |
| `--au-blue` | `#CC4C00` | Web colour (Pantone 718) — interactive elements, links |
| `--au-gold` | `#F36F21` | Primary brand (Pantone 166) — CTA buttons, highlights |
| `--bg` | `#FAF7F2` | Warm cream page background |
| `--bg-subtle` | `#F0EBE3` | Warm beige — card backgrounds, input fields |
| `--nevdis` | `#CC4C00` | NEVDIS brand orange — cards, badges, hovers |
| `--tca` | `#2789AF` | TCA brand teal — cards, badges, hovers |

Typography: **Roboto Slab** (headings — per Style Guide web spec) + **Arial** (body) — Roboto Slab loaded from Google Fonts.

---

## Browser Support
Modern evergreen browsers. IE11 not supported (Power Pages itself requires modern browsers).

---

*Internal POC — Austroads · NEVDIS · TCA · For Authorised Users Only*
