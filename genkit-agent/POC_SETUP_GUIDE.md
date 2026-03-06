# POC Setup Guide: Parallel Genkit Agent

This guide ensures your new Genkit agent has the correct permissions to talk to your new Dataverse environment for the Parallel POC.

---

## 1. Azure App Registration (Identity)
1.  **Create App**: Go to [Azure Portal > App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade) and click **New Registration**.
    *   **Name**: `DataHub-POC-Agent-S2S`
    *   **Account Type**: "Accounts in this organizational directory only"
2.  **Generate Secret**: Go to **Certificates & secrets** > **New client secret**.
    *   **Description**: `POC-Agent-Secret`
    *   **Value**: **Copy this value immediately** (you won't see it again).
3.  **Capture IDs**: Note down the **Application (client) ID** and **Directory (tenant) ID** from the Overview tab.

## 2. Power Platform Admin Center (Permissions)
1.  **Add App User**: Go to the [Power Platform Admin Center](https://admin.powerplatform.microsoft.com/environments).
2.  Select your **New Environment** > **Settings** > **Users + permissions** > **Application users**.
3.  Click **+ New app user** > **+ Add an app** and search for `DataHub-POC-Agent-S2S`.
4.  **Assign Business Unit**: Select your root business unit.
5.  **Assign Security Role**:
    *   Click the edit pencil next to **Security roles**.
    *   Assign a role that has **Read** access to your custom tables: `cre52_knowledge_article`, `cre52_product_field`, and `cre52_entitlement`.
    *   *Note: Ensure the role has at least User-level Read access to these tables.*

## 3. Genkit Agent `.env` Configuration
Create a new `.env` file for your POC agent instance:

```env
# New Dataverse Environment
DATAVERSE_URL=https://your-new-org.crm6.dynamics.com
DATAVERSE_TENANT_ID=your-new-tenant-id
DATAVERSE_CLIENT_ID=your-new-poc-client-id
DATAVERSE_CLIENT_SECRET=your-new-poc-secret

# Security & CORS
# Comma-separated list of allowed origins
ALLOWED_ORIGINS=https://your-poc-site.powerappsportals.com,http://localhost:3000

# Genkit / Google AI
GOOGLE_GENAI_API_KEY=your-google-api-key
PORT=3400
```

## 4. Power Pages Configuration
On your **new POC site**, add the following snippet to a Web Template (e.g., "Footer") to override the default production agent:

```html
<script>
  window.AU_AGENT_CONFIG = {
    // URL of the new Genkit Flow endpoint on Cloud Run
    endpoint: "https://your-poc-agent-service-url.a.run.app/datahubOrchestratorFlow"
  };
</script>
```
