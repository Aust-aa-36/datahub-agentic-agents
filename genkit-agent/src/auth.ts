import * as msal from "@azure/msal-node";
import dotenv from "dotenv";

dotenv.config();

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
