# Tech Stack — Austroads Data Info Hub

The project uses a modern, AI-integrated stack centered around Microsoft Power Platform and GitHub.

## Platforms & Infrastructure

- **Microsoft Power Pages**: Hosting the frontend portal using Web Templates, Liquid, and custom HTML/CSS/JS.
- **Dataverse**: Serving as the primary database for knowledge articles (22 rows) and product fields (111 rows).
- **Power Automate + AI Builder**: Powering the multi-agent router with GPT-driven specialists for NEVDIS, TCA, and general Austroads knowledge.
- **GitHub**: Source control, automated sync via `sync.js`, and CI/CD with GitHub Actions.

## Development & AI Toolchain

- **Jules**: Autonomous coding and feature implementation.
- **Gemini Code Assist**: Automated code reviews and security audits.
- **Conductor**: Project orchestration and track-based planning.

## Frontend Technologies

- **HTML5 / CSS3**: Vanilla CSS with a custom design system aligned to the **Austroads Style Guide 2021**.
- **JavaScript (ES6+)**: Custom agent panel logic and interactive page elements.
- **Google Fonts**: Roboto Slab (headings).
