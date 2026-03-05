# Austroads Data Info Hub — Power Pages POC

This repository contains the source code and deployment configuration for the Austroads Data Info Hub Power Pages POC.

## Project Structure

- `austroads-power-pages/`: **Source of Truth** for all HTML, CSS, and JS.
- `austroads-power-pages-verify2/`: The deployment-ready structure for Microsoft Power Pages CLI (`pac pages`).
- `sync.js`: A script that automates syncing changes from the source folder to the deployment folder.
- `.github/workflows/deploy.yml`: GitHub Actions workflow for CI/CD.

## Getting Started

### Prerequisites

- Node.js (>=18.0.0)
- Microsoft Power Platform CLI (`pac`)

### Development Workflow

1.  Make your changes in the `austroads-power-pages/` directory.
2.  Run the sync script to update the deployment folder:
    ```bash
    npm run sync
    ```
3.  Verify the changes in `austroads-power-pages-verify2/datahub---datahub/`.
4.  Commit and push your changes to GitHub.

## CI/CD Deployment

The project is set up with GitHub Actions to automatically deploy to Power Pages on every push to the `master` branch.

### Required GitHub Secrets

To enable deployment, you must add the following secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

| Secret | Description |
|--------|-------------|
| `CLIENT_ID` | Microsoft Entra ID (Azure AD) Application ID |
| `CLIENT_SECRET` | Microsoft Entra ID (Azure AD) Application Secret |
| `TENANT_ID` | Microsoft Entra ID (Azure AD) Tenant ID |
| `ENVIRONMENT_URL` | Dataverse environment URL (e.g., `https://datahub-austroads.crm6.dynamics.com/`) |

## License

Internal POC — Austroads · NEVDIS · TCA · For Authorised Users Only
