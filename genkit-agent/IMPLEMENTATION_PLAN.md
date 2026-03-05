# Implementation Guide: DataHub Genkit AI Agent (v3)

This document provides a feature-rich, step-by-step guide for each task in the v3 architecture migration. Each section is designed to be copied directly into your project management tool (GitHub Projects, Azure DevOps, etc.) as a ticket description.

---

## Phase 1: Environment & Identity Setup

### Task 1.1: GCP Service Account Setup
**Goal:** Create a secure identity for the Genkit backend to call the Gemini 1.5 Pro model.

**Steps:**
1.  Go to the [GCP Service Accounts Console](https://console.cloud.google.com/iam-admin/serviceaccounts).
2.  Click **Create Service Account**. Name: `datahub-genkit-agent`.
3.  **Grant Role:** Search for and add `Vertex AI User` (`roles/aiplatform.user`).
4.  **Create Key:** Click on the service account > **Keys** tab > **Add Key** > **Create new key** > **JSON**.
5.  **Secure Storage:** Download the JSON key.
    *   Save it locally as `genkit-agent/credentials/gcp-key.json`.
    *   **CRITICAL:** Ensure `credentials/` is in your `.gitignore`.

---

### Task 1.2: Azure App Registration (Dataverse S2S)
**Goal:** Create a Service-to-Service (S2S) identity for Genkit to query Dataverse without a user login.

**Steps:**
1.  Go to [Azure Portal > App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade).
2.  Click **New Registration**. Name: `DataHub-Agent-S2S`.
3.  **Secrets:** Go to **Certificates & secrets** > **New client secret**. Copy the **Value** immediately.
4.  **Dataverse Setup:**
    *   Go to [Power Platform Admin Center](https://admin.powerplatform.microsoft.com/).
    *   Select your **Environment** > **Settings** > **Users + permissions** > **Application users**.
    *   Click **New app user** > **Add an app** > Search for `DataHub-Agent-S2S`.
    *   Assign a Security Role that has **Read** access to `Knowledge Article` and `Product Field`.

---

### Task 1.3: Entra ID Group for Trial Users
**Goal:** Create a security boundary for your 2 internal test users.

**Steps:**
1.  Go to [Azure Portal > Groups](https://portal.azure.com/#view/Microsoft_AAD_IAM/GroupsManagementMenuBlade/~/AllGroups).
2.  Click **New group**. Name: `DataHub-Trial-Testers`. Type: **Security**.
3.  **Add Members:** Add your 2 test users.
4.  **Copy Object ID:** Copy the **Object ID** from the group overview for Step 2.2.

---

## Phase 2: Dataverse Entitlement Architecture

### Task 2.1: Create Entitlement Table
**Goal:** Define a many-to-many relationship between Web Roles and Knowledge Articles.

**Table Definition:**
*   **Name:** `cre52_entitlement`
*   **Logical Name:** `cre52_entitlement`
*   **Primary Column:** `cre52_name` (Text)
*   **Relationship A:** Lookup to `cre52_knowledge_article`
*   **Relationship B:** Web Role Name (Text or Lookup to `powerpage_webrole`)

---

### Task 2.2: Map Entra Group to Web Role
**Goal:** Automatically assign the "DataHub Specialist" role to anyone in the Entra ID group.

**Steps:**
1.  Open **Portal Management App** > **Security** > **Web Roles**.
2.  Create a new Web Role: **"DataHub Specialist"**.
3.  Go to **Related** tab > **Cloud Service IdP Configurations**.
4.  Click **Add New**:
    *   **Name:** `Entra-Group-Sync`
    *   **External Policy ID / Group Object ID:** (Paste the Object ID from Task 1.3)
    *   **Provider Name:** `AzureAD`

---

### Task 2.3: Resolve Profile Page Redirect
**Goal:** Prevent internal users from being stuck on the broken profile registration screen.

**Steps:**
1.  Open **Portal Management App** > **Website** > **Site Settings**.
2.  Update/Create `Authentication/Registration/ProfileRedirectEnabled` = `false`.
3.  **Table Permission Check:**
    *   Go to **Design Studio** > **Security** > **Table permissions**.
    *   Ensure a permission for the `Contact` table exists with **Access Type: Self** and **Read/Write** enabled for the **Authenticated Users** role.

---

## Phase 3: Genkit Backend Implementation

### Task 3.1: Dataverse Authentication Logic
**Goal:** Implement the OAuth2 client to fetch the Azure AD token for Dataverse.

**Code Snippet (`src/auth.ts`):**
```typescript
import * as msal from "@azure/msal-node";

const msalConfig = {
    auth: {
        clientId: process.env.DATAVERSE_CLIENT_ID!,
        authority: `https://login.microsoftonline.com/${process.env.DATAVERSE_TENANT_ID}`,
        clientSecret: process.env.DATAVERSE_CLIENT_SECRET!,
    }
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

export async function getDataverseToken() {
    const tokenResponse = await cca.acquireTokenByClientCredential({
        scopes: [`${process.env.DATAVERSE_URL}/.default`],
    });
    return tokenResponse?.accessToken;
}
```

---

### Task 3.2: Implement Secure Retrieval Tool
**Goal:** Write the OData query that joins Knowledge, Fields, and Entitlements.

**Code Snippet (Logic for `getKnowledgeTool`):**
```typescript
async (input) => {
    const token = await getDataverseToken();
    const domainValue = input.domain === 'NEVDIS' ? 1 : 2; // Mapping to Choice values

    // OData Query with Filter and Expand
    const url = `${process.env.DATAVERSE_URL}/api/data/v9.2/cre52_knowledge_articles` +
                `?$filter=cre52_domain eq ${domainValue} and cre52_status eq 1` +
                `&$expand=cre52_product_field_RelatedArticle($select=cre52_field_name,cre52_field_description)` +
                `&$expand=cre52_entitlement_RelatedArticle($filter=cre52_web_role_name eq '${input.userRole}')`;

    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    
    // Logic: If entitlement expansion is empty, filter the article out (Security check)
    return response.data.value.filter(article => article.cre52_entitlement_RelatedArticle.length > 0);
}
```

---

## Phase 4: Power Pages Frontend Integration

### Task 4.1: User Context Extraction
**Goal:** Capture the user's role and email from Liquid to send to the bot.

**Snippet for `home/page-body.html`:**
```html
<div id="au-user-data" 
     data-full-name="{{ user.fullname }}" 
     data-email="{{ user.emailaddress1 }}"
     data-role="{{ user.roles | first }}"> <!-- Simplistic role capture -->
</div>
```

**Snippet for `home/home.js`:**
```javascript
const userData = document.getElementById('au-user-data');
const payload = {
    message: userMsg,
    userRole: userData.getAttribute('data-role'),
    user: { email: userData.getAttribute('data-email') }
};
```

---

## Phase 5: Deployment & Hardening

### Task 5.1: Deploy to Cloud Run
**Goal:** Host the Genkit backend as a secure, auto-scaling API.

**Command:**
```bash
gcloud run deploy datahub-genkit-agent \
  --source . \
  --env-vars-file .env.yaml \
  --allow-unauthenticated \
  --region us-central1
```

### Task 5.2: Configure CORS Security
**Goal:** Prevent other sites from calling your bot's API.

**Middleware Snippet (`src/index.ts`):**
```typescript
// In your Express/Server setup
app.use(cors({
  origin: 'https://datahub.powerappsportals.com' // Your Power Pages URL
}));
```
