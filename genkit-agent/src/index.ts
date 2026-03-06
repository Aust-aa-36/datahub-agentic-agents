import { genkit, z } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';
import axios from 'axios';
import { getDataverseToken } from './auth';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

/**
 * GENKIT CONFIGURATION
 * Now using Vertex AI (Google Cloud) for enterprise security.
 */
export const ai = genkit({
  plugins: [
    vertexAI({
      projectId: process.env.GCP_PROJECT,
      location: process.env.GCP_LOCATION || 'us-central1',
    }),
  ],
});

/**
 * CORS Configuration for Power Pages Sites
 * Allows multiple origins (Production + POC sites) via ALLOWED_ORIGINS env var.
 */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(o => o !== '');

/**
 * PROMPT TEMPLATES (Extracted from GitHub repo)
 */
const ROUTER_PROMPT = `
You are a message classifier for the Austroads Data Info Hub. Your ONLY job is to classify the user's question into one of three domains. You must respond with valid JSON only — no other text.

Domains:
- NEVDIS: vehicle registration, VINs, driver licences, stolen vehicles, write-offs, plate-to-VIN, safety recalls, AEC data, BITRE census, RAV, Gold data, or NEVDIS as a system.
- TCA: heavy vehicles, telematics, GNSS telemetry, spatiotemporal data, on-board mass, freight routes, spatial data services, road analytics, vehicle enrolment, NTF, IAC, B2B, HPFR, or TCA as an organisation.
- GENERAL: Austroads itself, how to get access to data generally, contacts, cross-domain comparisons, greetings, or anything that does not clearly belong to NEVDIS or TCA.

Products:
- NEVDIS: vehicles-reg, natvin, driver, stolen, gold, p2v, recall, aec, bitre, rav
- TCA: ems, spatiotemporal, spatial, road-analytics, smart-obm, hpfr, nz

Respond ONLY with JSON in this exact format:
{"domain":"NEVDIS","intent":"asking about plate-to-VIN access requirements","product":"p2v"}
`;

const NEVDIS_SYSTEM = `
You are the NEVDIS specialist assistant for the Austroads Data Info Hub.
Expert on: National Exchange of Vehicle and Driver Information System.
- Answer questions about NEVDIS data products using the provided knowledge base.
- Explain contents, access requirements, and delivery methods.
- Use structured metadata for precise technical answers.
- Direct users to nevdis@austroads.com.au for access.
- TONE: Concise, professional (1-3 short paragraphs).
`;

const TCA_SYSTEM = `
You are the TCA specialist assistant for the Austroads Data Info Hub.
Expert on: Transport Certification Australia and the National Telematics Framework (NTF).
- Answer questions about heavy vehicle location, speed, weight, and road access data.
- Direct users to urm.tca.gov.au (Access) or support@tca.gov.au (Enquiries).
- TONE: Concise, professional (1-3 short paragraphs).
`;

const GENERAL_SYSTEM = `
You are the general assistant for the Austroads Data Info Hub.
- Explain Austroads, NEVDIS, and TCA at a high level.
- Help users understand which programme has the data they need.
- Handle greetings warmly and provide general access guidance.
`;

/**
 * SKILLED AGENT: Knowledge Specialist (Grounded Tool)
 */
const getKnowledgeTool = ai.defineTool(
  {
    name: 'getKnowledgeTool',
    description: 'Retrieves factual product knowledge and technical fields from Dataverse.',
    inputSchema: z.object({
      domain: z.enum(['NEVDIS', 'TCA', 'GENERAL']),
      product: z.string().optional().describe('Specific product slug like "p2v" or "ems"'),
      userRole: z.string().optional().describe('The Power Pages Web Role of the user'),
    }),
  },
  async (input) => {
    const token = await getDataverseToken();
    const domainValue = input.domain === 'NEVDIS' ? 1 : 2; // Mapping to Choice values

    console.log(`[RAG] Fetching knowledge for ${input.product || input.domain} for role ${input.userRole}`);

    // OData Query with Filter and Expand
    const url = `${process.env.DATAVERSE_URL}/api/data/v9.2/cre52_knowledge_articles` +
                `?$filter=cre52_domain eq ${domainValue} and cre52_status eq 1` +
                (input.product ? ` and cre52_product_slug eq '${input.product}'` : '') +
                `&$expand=cre52_product_field_RelatedArticle($select=cre52_field_name,cre52_field_description)` +
                `&$expand=cre52_entitlement_RelatedArticle($filter=cre52_web_role_name eq '${input.userRole}')`;

    const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    
    // Logic: If entitlement expansion is empty, filter the article out (Security check)
    const authorizedArticles = response.data.value.filter((article: any) => 
        article.cre52_entitlement_RelatedArticle && article.cre52_entitlement_RelatedArticle.length > 0
    );

    if (authorizedArticles.length === 0) {
        return { 
            message: "No articles found or access denied for your role.",
            contact: input.domain === 'NEVDIS' ? "nevdis@austroads.com.au" : "support@tca.gov.au"
        };
    }

    return authorizedArticles.map((article: any) => ({
        title: article.cre52_title,
        summary: article.cre52_summary,
        metadata: {
          category: article.cre52_category,
          update_frequency: article.cre52_update_frequency,
          delivery: article.cre52_delivery_method,
          contact: input.domain === 'NEVDIS' ? "nevdis@austroads.com.au" : "support@tca.gov.au"
        },
        fields: article.cre52_product_field_RelatedArticle.map((field: any) => ({
            name: field.cre52_field_name,
            description: field.cre52_field_description
        }))
    }));
  }
);

/**
 * FACILITATOR: The Orchestrator
 */
export const datahubOrchestratorFlow = ai.defineFlow(
  {
    name: 'datahubOrchestratorFlow',
    inputSchema: z.object({
      message: z.string(),
      history: z.array(z.object({ role: z.enum(['user', 'model']), text: z.string() })).optional(),
      user: z.object({ firstName: z.string(), fullName: z.string(), email: z.string() }).optional(),
      userRole: z.string().optional(),
    }),
  },
  async (input) => {
    // 1. ROUTING & INTENT CLASSIFICATION
    const routerResponse = await ai.generate({
      model: vertexAI.model('gemini-1.5-pro'),
      system: ROUTER_PROMPT,
      prompt: input.message,
      // Pass history as text block to match v2 logic
      messages: [{ role: 'user', content: [{ text: `History: ${JSON.stringify(input.history)}` }] }],
    });

    const routing = JSON.parse(routerResponse.text || '{}');
    const systemPrompt = routing.domain === 'NEVDIS' ? NEVDIS_SYSTEM : (routing.domain === 'TCA' ? TCA_SYSTEM : GENERAL_SYSTEM);

    // 2. GROUNDED RESPONSE GENERATION
    const response = await ai.generate({
      model: vertexAI.model('gemini-1.5-pro'),
      system: systemPrompt,
      prompt: input.message,
      tools: [getKnowledgeTool],
      // We explicitly instruct the model to use the tool
      config: {
        // Temperature 0 for factual accuracy
        temperature: 0,
      }
    });

    return { 
      reply: response.text,
      domain: routing.domain,
      intent: routing.intent 
    };
  }
);

/**
 * SERVER SETUP
 * Starts the Genkit flow server with CORS enabled.
 */
ai.startFlowServer({
  flows: [datahubOrchestratorFlow],
  cors: {
    origin: (origin, callback) => {
      // Allow if origin is in ALLOWED_ORIGINS list or if no origin (e.g. server-to-server)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  port: parseInt(process.env.PORT || '3400'),
});

