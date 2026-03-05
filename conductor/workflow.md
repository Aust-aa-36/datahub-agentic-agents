# Workflow — Austroads Data Info Hub

The development and deployment workflow for the Austroads Data Info Hub project is designed for rapid, AI-assisted iteration with robust verification and automated deployment.

## Development Lifecycle

### Research & Strategy

-   **Investigate**: Analyze the existing Power Pages structure and Dataverse model.
-   **Plan**: Create or update Conductor tracks in `conductor/tracks.md`.
-   **Spec**: Write detailed track plans in `conductor/tracks/<track_id>/plan.md`.

### Implementation (AI-First)

-   **Autonomous Coding**: Use **Jules** for implementing features and fixing bugs.
-   **Surgical Edits**: Use targeted `replace` or `write_file` calls to modify the codebase.
-   **Local Sync**: Run `npm run sync` to update the deployment-ready `austroads-power-pages-verify2` directory.

### Review & Verification

-   **Automated Review**: **Gemini Code Assist** performs reviews on all pull requests.
-   **Manual Sync**: Confirm that changes are correctly reflected in the target Power Pages environment.

## Deployment Strategy

### CI/CD Pipeline

-   **Trigger**: Every push to the `master` or `main` branch.
-   **Sync**: The GitHub Action runs `node sync.js` to build the deployment artifact.
-   **Upload**: The Power Platform CLI (`pac pages upload`) deploys the synchronized files to the live Power Pages site.

## Branching & Release

-   **Trunk-Based Development**: Directly commit to `master` for rapid POC iteration.
-   **Feature Branches**: Use branches for complex implementations, with Jules and Gemini Assist facilitating the PR process.
