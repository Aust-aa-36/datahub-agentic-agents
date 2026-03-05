/**
 * Power Pages Chatbot Integration (Refined for DataHub Facilitator)
 * This script handles DOM detail capture and sends them to the Genkit Facilitator.
 */
async function callDataHubAgent(userMessage) {
    const GENKIT_ENDPOINT = "https://YOUR_CLOUD_RUN_URL/datahubFacilitatorFlow";

    // CAPTURE DOM DETAILS
    // -----------------------------------------------------------------
    // Power Pages often stores context in global variables or the DOM.
    const contextDetails = {
        currentPage: window.location.pathname,
        userRole: document.getElementById("user-role-id")?.innerText || "Guest",
        companyContext: document.querySelector(".navbar-brand")?.innerText || "Unknown",
        // Capture any other hidden field relevant to the agent
        viewContext: document.getElementById("current-view-name")?.value || "Default"
    };

    try {
        const response = await fetch(GENKIT_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                data: { 
                    message: userMessage,
                    domContext: contextDetails,
                    // Keep track of simple history in the browser session
                    history: getChatHistory() 
                }
            })
        });

        const json = await response.json();
        const aiReply = json.result.reply;

        displayBotMessage(aiReply);
        saveToChatHistory("user", userMessage);
        saveToChatHistory("model", aiReply);

    } catch (error) {
        console.error("DataHub Agent request failed:", error);
        displayBotMessage("I'm sorry, I'm having trouble connecting right now.");
    }
}

let sessionHistory = [];
function getChatHistory() { return sessionHistory.slice(-10); } // Last 10 messages
function saveToChatHistory(role, text) { sessionHistory.push({ role, text }); }

// UI Hook
function onSendMessage() {
    const msg = document.getElementById("chatInput").value;
    if (!msg) return;
    
    displayUserMessage(msg);
    callDataHubAgent(msg);
    document.getElementById("chatInput").value = "";
}
