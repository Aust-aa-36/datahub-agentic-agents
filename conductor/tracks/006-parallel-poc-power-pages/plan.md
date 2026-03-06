# Track Plan — Parallel POC Power Pages Site

This track captures the tasks required to stand up a parallel Power Pages site, replicate Dataverse tables, and deploy the Genkit agent for testing.

## Project Summary
- **Owner**: Aaron
- **Framework**: Genkit AI / Power Pages
- **Target Site**: (TBD - New Power Pages Site URL)
- **Status**: Active

## Tasks List

### Environment Setup (To Do)
- [ ] **Provision New Site**: Create a new Power Pages site in a dedicated environment.
- [ ] **Replicate Dataverse Schema**: Create `cre52_knowledge_article`, `cre52_product_field`, and `cre52_entitlement` tables.
- [ ] **Configure Azure App Registration**: Create a new S2S app registration and assign it as an app user.

### Genkit Deployment (To Do)
- [x] **Update Genkit Config**: Vertex AI and multi-tenant CORS support added.
- [x] **Prepare Deployment Scripts**: `Dockerfile` and `deploy.sh` created.
- [x] **Create Setup Guide**: `POC_SETUP_GUIDE.md` finalized.
- [ ] **Deploy to Cloud Run**: Push the updated backend to a new Cloud Run service.
- [ ] **Configure CORS**: Ensure the new site URL is allowed in `.env`.

### Frontend Integration (To Do)
- [ ] **Deploy UI Assets**: Sync the shared design system and pages to the new site.
- [x] **Update Chatbot JS**: Configurable `AGENT_ENDPOINT` added to `home.js`.
- [ ] **Configure POC Endpoint**: Add `window.AU_AGENT_CONFIG` to POC site Web Template.

## Key Files
- `genkit-agent/src/index.ts`
- `genkit-agent/src/auth.ts`
- `genkit-agent/deploy.sh`
- `genkit-agent/POC_SETUP_GUIDE.md`
- `austroads-power-pages/home/home.js`
