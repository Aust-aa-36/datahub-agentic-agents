# DataHub AI Agent (Genkit Backend) - v3 Architecture

This directory contains the **v3 Architecture** for the Austroads Data Info Hub AI Agent. It transitions the bot from a Power Automate + AI Builder monolithic approach to an **Orchestrator-Worker** pattern using [Firebase Genkit](https://firebase.google.com/docs/genkit) and Google Gemini 1.5 Pro.

## Why Genkit?
1. **Dynamic Grounding**: Bypasses the ~4,000 token limit of AI Builder by dynamically fetching only the required Dataverse fields at runtime using "Tools" (Function Calling).
2. **Entitlement-Based Access Control (EBAC)**: Securely checks a user's Power Pages Web Role against Dataverse entitlements *before* handing data to the LLM.
3. **Specialized Agents**: The `datahubOrchestratorFlow` routes user intents to specialized system prompts (NEVDIS, TCA, General), ensuring strict adherence to tone, contact info, and constraints without prompt-bleed.

## Directory Structure
- `src/index.ts` - The core Genkit flows, routing logic, and specialized agent prompts.
- `power-pages-bot.js` - An updated reference script for the Power Pages frontend that captures user context (DOM/Web Roles) and communicates with this Genkit backend.
- `.env.example` - Template for necessary Google Cloud and Azure AD secrets.

## Local Development
1. Copy `.env.example` to `.env` and fill in credentials.
2. Run `npm install`
3. Run `npm run dev`
4. In a separate terminal, start the Genkit UI: `genkit start`
