# Product Guidelines — Austroads Data Info Hub

Technical and design standards for the Austroads Data Info Hub, ensuring 100% alignment with official brand identities and Power Pages environment constraints.

## 1. Brand Identity & Design System

### 1.1 Official Austroads Palette (Style Guide 2021)
All components must use these specific hexadecimal values for consistency across the hub.

- **Austroads Corporate Orange**: `#F36F21` (C0 M70 Y100 K0) — Primary brand accent.
- **Austroads Web Orange**: `#CC4C00` (C14 M83 Y100 K4) — Primary color for NEVDIS-related components and links.
- **Pitch (Navy/Charcoal)**: `#3C3533` (C60 M60 Y60 K60) — Used for headers, footers, and primary text.
- **Background**: Warm Cream/Beige (`#F9F7F2`) is preferred over pure white for better readability and brand alignment.

### 1.2 Official TCA Palette
- **TCA Teal**: `#2789AF` — Primary color for all TCA-related components and sections.
- **TCA Dark Grey**: `#3C3533` (Shared with Austroads Pitch).

### 1.3 Typography
- **Headings**: `Roboto Slab` (Official Austroads web heading font).
- **Body Text**: `Arial` (Official Austroads publication and correspondence font).
- **Logo Wordmark**: `Verdana Italic` (Specific to the logo graphic).

---

## 2. Component Mandates

### 2.1 Section Theming
Apply the following CSS classes to `<section>` wrappers to automatically theme children:
- `.nevdis-section`: Triggers `#CC4C00` accents, orange badges, and NEVDIS iconography.
- `.tca-section`: Triggers `#2789AF` accents, teal badges, and TCA iconography.

### 2.2 UI Positioning (Power Pages Constraint)
- **Rule**: NEVER use `position:fixed` or `position:sticky` inside page-content HTML.
- **Why**: Power Pages wraps page content in a `transform`-active container that breaks standard viewport positioning.
- **Solution**: Any fixed UI (like the AI Drawer) must be created in JavaScript and appended to `document.body` to sit outside the transformed wrapper.

### 2.3 Shared Assets
- **CSS**: All shared styles must be inlined in the `Austroads-Layout` web template. Do not rely on external `.css` web files as browser caching in Power Pages is unreliable.
- **Logos**: Use the transparent PNG version of the Austroads/TCA logo, encoded as a base64 string in the layout template to ensure instant loading.

---

## 3. AI Agent Standards (v2)

### 3.1 Interaction Model
- **Classification**: Every query must pass through the `Router` to be directed to the correct specialist (NEVDIS, TCA, or General).
- **Responses**: Use structured Markdown. Headers (`###`), bold text, and bullet points are mandatory for complex data descriptions.
- **Citations**: Always provide links to the internal product detail pages (e.g., `/detail-p2v`) when mentioning specific datasets.

---

*Verified Guideline v2.1 · 5 March 2026*
