# Austroads Data Info Hub — AI Agent Technical Manual

Welcome, Agent. This repository is a Microsoft Power Pages POC integrated with a multi-agent AI router. This manual defines the system architecture, deployment protocols, and CI/CD workflows.

---

## 🤖 AI Agent Onboarding

### 1. Essential Skills
To work effectively in this repository, ensure you have the following skills active:
- `universal-coding-rules`: Standard engineering principles.
- `coding-standards`: TypeScript/JavaScript best practices.
- `ai-cicd-setup`: Understanding of the Jules/Gemini pipeline.

### 2. Environmental Constraints (The "Power Pages" Gotchas)
- **Positioning**: `position:fixed` is broken inside page content due to a CSS-transformed ancestor. **Always** build fixed-UI components (drawers, modals) in JS and append to `document.body`.
- **Event Listeners**: Standard listeners disappear on DOM re-renders. **Always** use inline `onclick` or document-level delegation.
- **CSS Delivery**: Browser caching for `.css` web files is unreliable. **Always** inline shared CSS in the web template (`Austroads-Layout`).

---

## 📁 Repository Map

- `austroads-power-pages/` : **Source of Truth**. Edit only here.
  - `home/` : AI Chat panel logic (`home.js`) and styles (`home.css`).
  - `shared/` : Shared design system (`austroads.css`).
  - `agent-skill/` : AI Specialist prompts and Dataverse seed data.
- `austroads-power-pages-verify2/` : **Deployment Folder**. Managed by `pac pages`.
- `conductor/` : Project orchestration and track plans.
- `.github/workflows/` : CI/CD pipelines (Power Pages Upload, Jules, Gemini).
- `sync.js` : Automation for the "Dual-Copy" deployment pattern.

---

## 🚀 Deployment Process

### Step 1: Implementation
Implement features in `austroads-power-pages/`. Follow the `.gemini/styleguide.md` strictly.

### Step 2: Synchronization
Run the sync script to propagate changes to the deployment-ready folder:
```bash
npm run sync
```
*Note: This script handles the dual-copy requirement and CSS inlining.*

### Step 3: CI/CD Upload
Pushes to `master` trigger the `.github/workflows/deploy.yml` which:
1. Runs `sync.js`.
2. Authenticates with Power Platform CLI (`pac`).
3. Uploads `austroads-power-pages-verify2/datahub---datahub` to the live site.

---

## 🛠️ AI Toolchain (CI/CD)

### Jules (Autonomous Coding)
- **Trigger**: Create an issue with the `jules` label.
- **Protocol**: Jules will read the issue, implement a fix, and open a PR.

### Gemini (Automated Review)
- **Trigger**: Any Pull Request.
- **Protocol**: Gemini reviews changes against `.gemini/styleguide.md` and provides inline feedback.

### Conductor (Planning)
- **Entry Point**: `conductor/index.md`
- **Mandate**: Every major feature must have a corresponding "Track" in `conductor/tracks.md` and a detailed plan.

---

## ⚖️ Standards Compliance
- **Design System**: Align with `conductor/product-guidelines.md`.
- **Coding Style**: Strictly follow `.gemini/styleguide.md`.
- **Secrets**: NEVER commit credentials. Use GitHub Secrets for `CLIENT_ID`, `CLIENT_SECRET`, and `TENANT_ID`.

---

*Verified Agent Protocol · Austroads Data Info Hub · POC v2*
