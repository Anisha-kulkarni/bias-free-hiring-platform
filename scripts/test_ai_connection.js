const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testConnection() {
    console.log("Checking API Key...");
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("ERROR: GEMINI_API_KEY is missing in .env file");
        return;
    }
    console.log("Key found (starts with):", key.substring(0, 5) + "...");

    try {
        console.log("Initializing Gemini Client...");
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log("Sending test prompt...");
        const result = await model.generateContent("Hello, are you online?");
        const response = await result.response;
        const text = response.text();
        console.log("SUCCESS! Response received:");
        console.log(text);
    } catch (error) {
        console.error("CONNECTION FAILED:");
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        if (error.response) {
            console.error("Error Details:", JSON.stringify(error.response, null, 2));
        }
    }
}

testConnection();
