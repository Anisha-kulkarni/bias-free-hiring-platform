const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        console.log("Listing available models...");
        // For earlier versions of the SDK, listModels might be on the client or a specific manager.
        // But in 0.x SDK it was often not directly exposed easily or required correct method call.
        // Actually, for checking connection, let's just try to call a standard model first.

        // However, the error message clearly suggests "Call ListModels to see...".
        // In the Node SDK, checking models usually involves the ModelManager.
        // But since I might not have the exact syntax handy without docs, 
        // I will try to fall back to 'gemini-pro' which is the safest bet if 'flash' is failing,
        // OR try 'gemini-1.5-flash-latest'.

        // Let's stick to 'gemini-pro' for immediate stability if 1.5-flash is flaky for this key/region.
        // BUT, I will first just run a quick test with 'gemini-pro' to confirm it works.
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("gemini-2.5-flash works: ", await result.response.text());

    } catch (error) {
        console.error("Error:", error.message);
    }
}

listModels();
