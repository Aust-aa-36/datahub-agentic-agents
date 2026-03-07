---
name: power-platform-ops
description: Comprehensive management of Power Platform CI/CD, including Dataverse table replication, solution management, and Power Pages automated deployments via GitHub Actions.
---

# Power Platform Operations

This skill provides expert procedural guidance for automating Power Platform and Power Pages development lifecycles using official GitHub Actions and the PAC CLI.

## Core Workflows

### 1. Power Pages Site Deployment
Use this workflow when syncing local web files (HTML, CSS, JS) to a live Power Pages environment.

- **Prerequisite**: Ensure the local source directory matches the standard Power Pages folder structure.
- **Action**: Use `microsoft/powerplatform-actions/upload-paportal@v1`.
- **Command (Direct)**: 
  ```bash
  pac pages upload --path "path/to/site" --environment "env-id-or-url" --modelVersion 2
  ```
- **Troubleshooting**: If the action fails with "Management API" errors, use the `actions-install` action and call `pac` directly using the absolute path provided in `$POWERPLATFORMTOOLS_PACPATH`.

### 2. Dataverse Table & Data Replication
Use this to synchronize record data between environments (e.g., from Prod to POC).

- **Prerequisite**: Create a schema XML file using the **Configuration Migration Tool**.
- **Export**: Use `microsoft/powerplatform-actions/export-data@v0`.
- **Import**: Use `microsoft/powerplatform-actions/import-data@v0`.
- **Note**: These actions typically require `windows-latest` runners in GitHub Actions.

### 3. Solution Management
Use for moving metadata, table definitions, and Power Automate flows.

- **Export**: `microsoft/powerplatform-actions/export-solution@v1`
- **Import**: `microsoft/powerplatform-actions/import-solution@v1`
- **Pattern**: Export as Unmanaged for source control; Import as Managed for downstream environments.

## Environment & Permissions
See [references/permissions.md](references/permissions.md) for detailed Service Principal and API permission setup.

## Key Principles
- **Model Versioning**: Always use `modelVersion: 2` for modern Power Pages sites.
- **Credential Hygiene**: Strictly use GitHub Secrets (`CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID`).
- **Sync First**: Always run local synchronization scripts (like `sync.js`) before initiating a Power Pages upload to ensure the deployment manifest is current.
