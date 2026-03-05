# Product Guidelines — Austroads Data Info Hub

Design and implementation standards for the Austroads Data Info Hub project, ensuring consistency across all pages and AI interactions.

## Design System

All components must align with the **Austroads Style Guide 2021** and **TCA Colour Palette**.

### Colors

- **Pitch (Navy)**: `#3C3533` (Pantone Black 7)
- **Primary Brand (Gold)**: `#F36F21` (Pantone 166)
- **Web Colour (Blue)**: `#CC4C00` (Pantone 718)
- **NEVDIS Orange**: `#CC4C00` (aligned with web colour)
- **TCA Teal**: `#2789AF`

### Typography

- **Headings**: Roboto Slab (Google Fonts)
- **Body**: Arial (System Font)

### Section Theming

- Apply `.nevdis-section` or `.tca-section` to `<section>` wrappers to automatically theme child cards, badges, and hover effects.

## UX Patterns

- **AI-First Entry**: The hero search bar in the home page opens the AI agent drawer.
- **Consistent Layouts**: Use the `au-grid-service` grid with `au-service-card` for all product catalogs.
- **Rich AI Bot Responses**:bot responses should use structured markdown with headers, bullet lists, and source citations.

## Engineering Standards

- **Vanilla CSS over Tailwind**: Maintain the custom design system in `austroads.css`.
- **Surgical Edits**: Use targeted changes and automated syncs to ensure maintainability.
- **Dataverse as Source of Truth**: All knowledge and field metadata must be managed in Dataverse.
