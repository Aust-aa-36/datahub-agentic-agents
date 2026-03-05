# Tech Stack — Austroads Data Info Hub

The project uses a modern, AI-integrated stack centered around Microsoft Power Platform and GitHub, optimized for rapid, automated iteration.

## Platforms & Infrastructure

- **Microsoft Power Pages**: Frontend portal hosting.
  - **Customization**: Web Templates, Liquid, HTML/JS/CSS.
  - **Constraint Handling**: Fixed UI components (AI Drawer) built in JS and appended to `document.body`.
- **Dataverse**: Source of truth for knowledge and product metadata.
  - `au_knowledge_article`: 22 rows.
  - `au_product_field`: 111 rows.
- **Power Automate + AI Builder**: Multi-agent router backend.
  - **Model**: Router → Specialist pattern.
  - **Prompts**: Domain-aware prompts (NEVDIS, TCA, GENERAL).
- **GitHub**: Source control and CI/CD.

## Development & AI Toolchain

- **Jules**: Autonomous coding and feature implementation (triggered by `jules` label).
- **Gemini Code Assist**: Automated code reviews (against `.gemini/styleguide.md`).
- **Conductor**: Project orchestration and track-based planning.
- **PAC CLI**: Automated upload to Power Pages environment.

## Frontend Technologies

- **HTML5 / CSS3**: Vanilla CSS with a custom design system.
- **JavaScript (ES6+)**: Custom agent panel logic, markdown rendering, and event delegation.
- **Google Fonts**: Roboto Slab (headings).

## Automation Scripts

- `sync.js`: Automates the Power Pages "Dual-Copy" deployment pattern and CSS inlining.
- `.github/workflows/deploy.yml`: End-to-end CI/CD pipeline.
