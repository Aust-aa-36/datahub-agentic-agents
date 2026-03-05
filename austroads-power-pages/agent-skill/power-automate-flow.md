# Power Automate Flow — Datahub Agent Skill

## Overview

This flow exposes an HTTP endpoint that the Power Pages chat drawer calls.
It receives the user's message, passes it to AI Builder's GPT prompt with
the Datahub system prompt, and returns the response as JSON.

---

## Step 1 — Create the Flow

1. Go to **make.powerautomate.com**
2. Click **+ Create** → **Instant cloud flow**
3. Name it: `Datahub-Agent-Skill`
4. Choose trigger: **When an HTTP request is received**
5. Click **Create**

---

## Step 2 — Configure the HTTP Trigger

In the trigger card, click **"Use sample payload to generate schema"** and paste:

```json
{
  "message": "What is NEVDIS?",
  "sessionId": "abc123"
}
```

Click **Done**. This generates the schema:

```json
{
  "type": "object",
  "properties": {
    "message": {
      "type": "string"
    },
    "sessionId": {
      "type": "string"
    }
  }
}
```

**Important:** Set **Method** to `POST`.

---

## Step 3 — Add AI Builder "Create text with GPT"

1. Click **+ New step**
2. Search for: `Create text with GPT` (under **AI Builder**)
3. Select the action

Configure it as follows:

**Prompt** — paste the full system prompt from `system-prompt.txt`, then append:

```
User question: @{triggerBody()?['message']}

Respond helpfully and concisely.
```

So the full prompt field looks like:

```
You are the Data Info Hub assistant for Austroads...
[paste entire system-prompt.txt content here]

User question: @{triggerBody()?['message']}

Respond helpfully and concisely.
```

> Use the dynamic content picker to insert `message` from the trigger body,
> or type the expression manually: `@{triggerBody()?['message']}`

---

## Step 4 — Add Response action

1. Click **+ New step**
2. Search for: `Response` (under **Request**)
3. Select **Response**

Configure:

| Field | Value |
|-------|-------|
| Status Code | `200` |
| Headers | See below |
| Body | See below |

**Headers** (add each as a key/value pair):

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |
| `Access-Control-Allow-Origin` | `https://datahub.powerappsportals.com` (use `*` for dev/testing only) |

**Body:**

```json
{
  "reply": "@{outputs('Create_text_with_GPT_using_a_prompt')?['text']}"
}
```

> **Note on the expression:** After adding the AI Builder step, use the
> dynamic content picker — look for **Text** under the AI Builder action.
> This inserts the correct path automatically. The action name in the
> expression will match whatever you named the step.

---

## Step 5 — Save and get the URL

1. Click **Save**
2. The HTTP trigger will now show the **HTTP POST URL**
3. Copy the full URL — it includes the SAS signature and is the endpoint
   used in `home.js`

---

## Step 6 — Test the flow

Use **Postman** or the Power Automate **Test** button:

**Method:** POST
**URL:** [your flow URL]
**Body (raw JSON):**
```json
{
  "message": "What is the Plate-to-VIN service?",
  "sessionId": "test-001"
}
```

**Expected response:**
```json
{
  "reply": "Plate-to-VIN (P2V) is a secure API service that converts..."
}
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 400 Bad Request | Check that the trigger body schema matches exactly |
| CORS error in browser | Confirm `Access-Control-Allow-Origin: *` header is in the Response action |
| Empty reply | Check the AI Builder output path — use dynamic content picker for "Text" |
| 429 Too Many Requests | AI Builder has rate limits; for production add retry logic |
| Flow times out | AI Builder responses can take 5–15s; the website shows a typing indicator during this |

---

## Production considerations (post-POC)

- Replace `Access-Control-Allow-Origin: *` with the specific Power Pages domain
- Add an `Authorization` header check or IP restriction to the flow
- Add error handling step to return a graceful `{ "reply": "..." }` on failure

---

# Multi-Agent Router Flow (v2)

## Architecture

The v2 flow replaces the single monolithic AI Builder call with a **router + specialist** pattern:

```
HTTP Trigger (POST)
  { message, sessionId, history[] }
        ↓
Initialize variable: ConversationContext (join history array)
        ↓
AI Builder #1: Router (short prompt — classifies intent)
  → returns JSON: { "domain": "NEVDIS", "intent": "..." }
        ↓
Parse JSON: extract domain + intent
        ↓
Switch on domain:
  ├─ NEVDIS  → List rows (au_knowledge_article, domain=1) → AI Builder #2 (NEVDIS prompt + rows)
  ├─ TCA     → List rows (au_knowledge_article, domain=2) → AI Builder #2 (TCA prompt + rows)
  └─ GENERAL → List rows (au_knowledge_article, domain=3) → AI Builder #2 (General prompt + rows)
        ↓
Response: { reply, domain, intent }
```

## New Flow: `Datahub-MultiAgent-Router`

### Step 1 — HTTP Trigger

Same as v1, but with expanded schema:

```json
{
  "message": "What is P2V?",
  "sessionId": "datahub-123",
  "history": [
    { "role": "user", "text": "Hello" },
    { "role": "bot", "text": "Hi! How can I help?" }
  ]
}
```

Schema:
```json
{
  "type": "object",
  "properties": {
    "message": { "type": "string" },
    "sessionId": { "type": "string" },
    "history": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "role": { "type": "string" },
          "text": { "type": "string" }
        }
      }
    }
  }
}
```

**Backward compatible:** `history` is optional. Old clients that don't send it still work.

### Step 2 — Build Conversation Context

Two actions:

**Action 2a — Select** (Data Operations → Select)
- **From:** `@{triggerBody()?['history']}`
- **Map (switch to text mode):** `@{concat(item()?['role'], ': ', item()?['text'])}`

This transforms each history item into a string like `"user: What is P2V?"`.

**Action 2b — Compose** named `Build_Context`
- **Inputs:** `@{if(empty(triggerBody()?['history']), '', join(body('Select'), decodeUriComponent('%0A')))}`

This joins the Select output with newlines. If history is empty/missing, it returns an empty string.

> **Note:** `decodeUriComponent('%0A')` is the Power Automate way to insert a newline character in `join()`. You can also use a **Join** action (Data Operations → Join) with the separator set to a newline instead of the Compose expression.

### Step 3 — AI Builder: Router Classification

Add **Create text with GPT** using the router prompt from `router-prompt.txt`:

```
You are a message classifier for the Austroads Data Info Hub...
[paste router-prompt.txt content]
```

Replace `{conversationContext}` with the Build_Context output.
Replace `{message}` with `@{triggerBody()?['message']}`.

### Step 4 — Parse Router JSON

Add a **Parse JSON** action on the router AI Builder output:

```json
{
  "type": "object",
  "properties": {
    "domain": { "type": "string" },
    "intent": { "type": "string" }
  }
}
```

**Error handling:** Wrap in a **Scope** with a **Configure run after** fallback that sets domain to `"GENERAL"` if parsing fails.

### Step 5 — Switch on Domain

Add a **Switch** action on `@{body('Parse_Router_JSON')?['domain']}`:

**Case: NEVDIS**
1. **List rows** from `au_knowledge_article` where `au_domain eq 1` and `au_status eq 1`
2. **AI Builder: Create text with GPT** using `nevdis-specialist-prompt.txt`
   - Replace `{knowledge}` with the listed rows (title + detail + access_info)
   - Replace `{conversationContext}` with Build_Context
   - Replace `{message}` with the user message

**Case: TCA**
1. **List rows** where `au_domain eq 2` and `au_status eq 1`
2. **AI Builder** using `tca-specialist-prompt.txt`

**Default (GENERAL)**
1. **List rows** where `au_domain eq 3` and `au_status eq 1`
2. **AI Builder** using `general-specialist-prompt.txt`

### Step 6 — Response

```json
{
  "reply": "@{outputs('Specialist_AI_Builder')?['text']}",
  "domain": "@{body('Parse_Router_JSON')?['domain']}",
  "intent": "@{body('Parse_Router_JSON')?['intent']}"
}
```

Headers: same as v1 (`Content-Type: application/json`, `Access-Control-Allow-Origin: *`).

### Step 7 — Save and Update home.js

1. Save the flow, copy the new HTTP POST URL
2. Update `AGENT_ENDPOINT` in `home.js` with the new URL
3. Deploy via PAC CLI
4. Keep the old v1 flow active as a fallback during testing

---

## Dataverse Table: `au_knowledge_article`

Create this table in make.powerapps.com → Tables:

### Core columns (v1)

| Column | Type | Notes |
|--------|------|-------|
| `au_title` | Single line (200) | Article title |
| `au_domain` | Choice: NEVDIS=1, TCA=2, General=3 | Domain classification |
| `au_product_name` | Single line (100) | Slug (e.g. "p2v") |
| `au_summary` | Multi-line (2000) | Short description |
| `au_detail` | Multi-line (10000) | Full knowledge content (includes condensed key-fields summary) |
| `au_access_info` | Multi-line (2000) | Access/eligibility/contact info |
| `au_keywords` | Single line (500) | Comma-separated search terms |
| `au_status` | Choice: Active=1, Draft=2, Archived=3 | Content lifecycle |

### New metadata columns (v2) — add to existing table

| Column                | Type                                                                           | Notes                                                                         |
| --------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `au_category`         | Choice: Data Element=1, Data Product=2, General=3                              | Classifies whether this is raw data or a derived service                      |
| `au_data_source`      | Single line (500)                                                              | Where the data comes from, e.g. "ACCC recall notices, Manufacturer VIN lists" |
| `au_delivery_method`  | Single line (500)                                                              | How data is delivered, e.g. "REST API (JSON/XML), Real-time response"         |
| `au_update_frequency` | Choice: Real-time=1, Daily=2, Monthly=3, Periodic=4, Annual=5, Static=6, N/A=7 | How often data is refreshed                                                   |
| `au_process_steps`    | Multi-line (4000)                                                              | Numbered steps describing how data flows from source to consumer              |
| `au_contact_email`    | Single line (200)                                                              | Primary contact email for access requests                                     |

Populate using `knowledge-seed-data-v2.json` (22 articles with all columns).

### Updating the "List rows" action

In each Switch case (NEVDIS, TCA, GENERAL), update the **Select columns** parameter to include the new fields:

```
au_title,au_product_name,au_summary,au_detail,au_access_info,au_category,au_data_source,au_delivery_method,au_update_frequency,au_process_steps,au_contact_email
```

### Updating the knowledge text block

In the **Select** action that builds the knowledge text for the specialist prompt, update the map expression to include the new metadata:

```
@{concat('## ', item()?['au_title'], decodeUriComponent('%0A'), 'Category: ', item()?['au_category'], ' | Delivery: ', item()?['au_delivery_method'], ' | Updates: ', item()?['au_update_frequency'], decodeUriComponent('%0A'), 'Source: ', item()?['au_data_source'], ' | Contact: ', item()?['au_contact_email'], decodeUriComponent('%0A'), item()?['au_summary'], decodeUriComponent('%0A'), item()?['au_detail'], decodeUriComponent('%0A'), 'Process: ', item()?['au_process_steps'], decodeUriComponent('%0A'), 'Access: ', item()?['au_access_info'])}
```

This produces a structured knowledge block per product that the specialist prompts can parse.

---

## Dataverse Table: `au_product_field` (child table)

This table stores individual input/output field definitions for each product. It has a **many-to-one** lookup relationship to `au_knowledge_article`.

### Create in make.powerapps.com → Tables → New table

| Column                 | Type                          | Notes                                                       |
| ---------------------- | ----------------------------- | ----------------------------------------------------------- |
| `au_field_name`        | Single line (200)             | Field name, e.g. "VIN / Chassis Number"                     |
| `au_field_type`        | Single line (50)              | Data type: String, Number, Date, Float, Boolean, Dataset    |
| `au_field_direction`   | Choice: Input=1, Output=2     | Whether the field is an input to or output from the product |
| `au_field_group`       | Single line (100)             | Logical grouping, e.g. "Vehicle Details", "Registration"    |
| `au_field_description` | Multi-line (1000)             | What the field contains                                     |
| `au_field_example`     | Single line (200)             | Example value, e.g. "6T1BD3FK90X141096"                     |
| `au_field_required`    | Yes/No                        | For input fields — is it required?                          |
| `au_sort_order`        | Whole Number                  | Display ordering within group                               |
| `au_knowledge_article` | Lookup → au_knowledge_article | Parent relationship (many fields → one article)             |

Populate using `product-fields-seed-data.json` (111 field records across 17 products).

### When to query this table (future enhancement)

**Current POC (Option A):** Field summaries are already baked into `au_detail` as condensed text (e.g. "Key fields: VIN (String), Make (String)..."). No flow changes needed — the existing "List rows" call returns them automatically.

**Future (Option B):** When users need full field-level detail:
1. Enhance the router to return `{ domain, intent, product }` (product slug)
2. Add a conditional **List rows from au_product_field** filtered by the specific product
3. Inject full field definitions only for the product being asked about
4. This avoids blowing AI Builder's ~4,000 token input limit by loading all 111 field definitions at once

---

## Prompt Files

| File | Purpose |
|------|---------|
| `router-prompt.txt` | Classifies user intent → NEVDIS / TCA / GENERAL |
| `nevdis-specialist-prompt.txt` | Answers NEVDIS product questions |
| `tca-specialist-prompt.txt` | Answers TCA product questions |
| `general-specialist-prompt.txt` | Handles greetings, cross-domain, general Austroads |

Each specialist prompt has three placeholders:
- `{knowledge}` — injected from Dataverse rows
- `{conversationContext}` — last 4 exchanges from history
- `{message}` — current user question

---

## Testing Checklist

### Routing tests (v1)

| Test | Expected Domain |
|------|----------------|
| "What is P2V?" | NEVDIS |
| "Tell me about road analytics" | TCA |
| "Hello" | GENERAL |
| "How do I access NEVDIS?" | NEVDIS |
| "What telematics data is available?" | TCA |
| "Compare NEVDIS and TCA" | GENERAL |
| Follow-up: "How do I access it?" (after NEVDIS Q) | NEVDIS (via history) |

### Structured knowledge tests (v2 — after adding new columns)

| Test | Expected behaviour |
|------|-------------------|
| "What inputs does P2V need?" | NEVDIS badge; mentions Plate Number, State/Territory, Enquiry Message as inputs |
| "How is vehicles-reg data delivered?" | NEVDIS badge; cites "Real-time data feeds to authorised organisations" |
| "Which TCA products use ArcGIS dashboards?" | TCA badge; lists road-analytics, smart-obm, hpfr, nz |
| "Compare P2V and recall delivery methods" | NEVDIS badge; both REST API real-time |
| "What is the process for AEC data?" | NEVDIS badge; gives 4 numbered process steps |
| "Which products are updated in real-time?" | GENERAL or NEVDIS badge; lists vehicles-reg, natvin, driver, stolen, p2v, recall, rav, ems, spatiotemporal |
| "What fields does vehicle registration return?" | NEVDIS badge; lists VIN, Make, Model, Body Type, etc. |
