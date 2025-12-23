const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testKey() {
    console.log("Testing API Key...");
    const key = process.env.GEMINI_API_KEY;
    console.log("Key in use:", key); // validation

    // Check if it matches the user's request
    if (key === 'AIzaSyAgAvPHdS8b_gk0kbWxz_-eWtM1sAGaCC4') {
        console.log("✅ Key matches the requested key.");
    } else {
        console.log("❌ Key DOES NOT match.");
    }

    try {
        const genAI = new GoogleGenerativeAI(key);
        console.log("Pinging Gemini API (gemini-2.5-flash)...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await model.generateContent("Say '2.5-Flash Working'");
            console.log("Response:", result.response.text());
            console.log("✅ gemini-2.5-flash Connection Successful!");
            return;
        } catch (err) {
            console.log("⚠️ gemini-2.5-flash failed:", err.message.split('[')[0]); // simplified log
        }

        console.log("Pinging Gemini API (gemini-1.5-flash)...");
        try {
            const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result2 = await model2.generateContent("Say 'Flash Working'");
            console.log("Response:", result2.response.text());
            console.log("✅ gemini-1.5-flash Connection Successful!");
        } catch (err) {
            console.error("❌ All models failed. Please check API Key permissions.");
            console.error("Last Error:", err.message);
        }

    } catch (e) {
        console.error("❌ API Test Failed:", e.message);
    }
}

testKey();
