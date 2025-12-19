const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Initialize Gemini API
// You need to get an API KEY from https://aistudio.google.com/app/apikey
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

async function generateQuestions(topic, difficulty = 2) {
    // 1. Check if API Key is available
    if (!genAI) {
        console.log("No API Key found. Using Mock Data.");
        return getMockQuestions(topic);
    }

    try {
        // 2. Call Real API
        // Set existing temperature to high for maximum variety
        const generationConfig = {
            temperature: 0.9,
            topP: 0.95,
            topK: 40,
        };
        const model = genAI.getGenerativeModel({ model: "gemini-pro", generationConfig });

        const difficultyText = difficulty === 1 ? "beginner/introductory" : (difficulty === 3 ? "expert/advanced" : "intermediate");

        const randomSeed = Math.floor(Math.random() * 100000); // Increased randomness range
        const prompt = `Act as an expert tutor. Generate 3 UNIQUE, ${difficultyText} level practice questions specifically about the topic: "${topic}".
                        
                        Requirements:
                        1. Questions must be directly related to the key concepts of "${topic}".
                        2. The difficulty level must be ${difficultyText}.
                        3. For each question, provide the "answer" which must be a clear, accurate explanation of the correct solution.
                        4. Ensure the answer is directly related to the specific question asked.
                        
                        Output strictly as a JSON array of objects with this format:
                        [
                            { "question": "The question text here?", "answer": "The detailed correct answer and explanation here." }
                        ]
                        
                        Random Seed: ${randomSeed}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up text to ensure it's valid JSON
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        let parsedData = JSON.parse(cleanedText);

        // Robustness: Ensure we have an array
        if (!Array.isArray(parsedData)) {
            // Did the AI wrap it in { "questions": [...] }?
            if (parsedData.questions && Array.isArray(parsedData.questions)) {
                parsedData = parsedData.questions;
            } else if (parsedData.data && Array.isArray(parsedData.data)) {
                parsedData = parsedData.data;
            } else {
                // Fallback: Try to wrap it if it's a single object
                parsedData = [parsedData];
            }
        }

        // Normalization: Ensure lowercase keys 'question' and 'answer'
        return parsedData.map(item => ({
            question: item.question || item.Question || "Question missing",
            answer: item.answer || item.Answer || "Answer missing"
        }));

    } catch (error) {
        console.error("Gemini API Error:", error.message);
        console.log("Falling back to Mock Data.");
        return getMockQuestions(topic);
    }
}

async function getChatResponse(message, contextUnit) {
    // 1. Check if API Key is available
    if (!genAI) {
        return `(Mock AI) That's a great question about "${message}"! To get real answers, please add a GEMINI_API_KEY to your .env file.`;
    }

    try {
        // 2. Call Real API
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = `You are a helpful AI tutor for a learning platform. 
                        The student is currently viewing the unit: "${contextUnit}".
                        
                        Student says: "${message}"
                        
                        Give a helpful, encouraging, and concise response (max 2-3 sentences).`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();

    } catch (error) {
        console.error("Gemini API Error (Chat):", error);
        return "I'm having trouble connecting to my brain right now. Please try again later. (Error: " + error.message + ")";
    }
}

// Helper: Mock Data Fallback
function getMockQuestions(topic) {
    return [
        {
            question: `What is the core concept of ${topic}?`,
            answer: `The core concept involves the fundamental principles that define ${topic}.`
        },
        {
            question: `How would you apply ${topic} in a real-world scenario?`,
            answer: `It is applied by analyzing the problem constraints and using ${topic} models to solve it.`
        },
        {
            question: `Describe the relationship between ${topic} and foundational principles.`,
            answer: `It builds upon basic axiomes to create complex systems.`
        }
    ];
}

module.exports = { generateQuestions, getChatResponse };
