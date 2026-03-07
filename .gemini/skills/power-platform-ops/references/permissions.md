# Service Principal & API Permissions for Power Platform

To ensure successful automated deployments and data replication, the Service Principal (App Registration) must have the following configuration.

## 1. Azure API Permissions
The following permissions must be added in **Azure Portal > App registrations > [App Name] > API permissions**:

| API | Type | Permission | Purpose |
| :--- | :--- | :--- | :--- |
| **Dynamics CRM** | Delegated | `user_impersonation` | Dataverse data access (Essential) |
| **Power Platform API** | Application | `AppManagement.ReadWrite.All` | Environment discovery and management |
| **PowerApps-Advisor** | Application | `Analysis.All` | Solution checker integration |

**CRITICAL**: You must click **"Grant admin consent for [Organization]"** after adding these permissions.

## 2. Power Platform Environment Roles
The App Registration must be added as an **Application User** in the target environment:

1. Go to **Power Platform Admin Center > Environments > [Environment]**.
2. Select **Settings > Users + permissions > Application users**.
3. Click **+ New app user**, add the app by its Client ID.
4. Assign the **System Administrator** security role to this app user.

## 3. GitHub Secrets
Ensure the following secrets are configured in the repository:

- `CLIENT_ID`: Application (client) ID.
- `TENANT_ID`: Directory (tenant) ID.
- `CLIENT_SECRET`: Client Secret Value.
- `ENVIRONMENT_URL`: The production or target environment URL.
