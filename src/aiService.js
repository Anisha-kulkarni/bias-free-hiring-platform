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
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig });

        const difficultyText = difficulty === 1 ? "beginner/introductory" : (difficulty === 3 ? "expert/advanced" : "intermediate");

        const randomSeed = Math.floor(Math.random() * 100000); // Increased randomness range
        const prompt = `Act as an expert tutor. Generate 3 UNIQUE, ${difficultyText} level multiple-choice questions specifically about the topic: "${topic}".
                        
                        Requirements:
                        1. Questions must be directly related to the key concepts of "${topic}".
                        2. The difficulty level must be ${difficultyText}.
                        3. Provide 4 distinct options for each question.
                        4. Clearly indicate the correct answer (it must be one of the options).
                        5. Provide a brief explanation for why the answer is correct.
                        
                        Output strictly as a JSON array of objects with this format:
                        [
                            { 
                                "question": "The question text?", 
                                "options": ["Option A", "Option B", "Option C", "Option D"], 
                                "correct_answer": "Option B",
                                "explanation": "Why B is correct." 
                            }
                        ]
                        
                        Random Seed: ${randomSeed}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Robust JSON Extraction: Find the array [...]
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.error("AI did not return a valid JSON array. Response:", text);
            throw new Error("Invalid JSON structure");
        }

        const cleanedText = jsonMatch[0];
        let parsedData = JSON.parse(cleanedText);

        // Robustness: Ensure we have an array
        if (!Array.isArray(parsedData)) {
            if (parsedData.questions && Array.isArray(parsedData.questions)) {
                parsedData = parsedData.questions;
            } else if (parsedData.data && Array.isArray(parsedData.data)) {
                parsedData = parsedData.data;
            } else {
                parsedData = [parsedData];
            }
        }

        // Normalization: Ensure items are valid objects with expected keys
        return parsedData.map(item => {
            // Helper to find a value case-insensitively
            const getVal = (obj, keys) => {
                for (const k of keys) {
                    if (obj[k]) return obj[k];
                    const lowerK = k.toLowerCase();
                    const found = Object.keys(obj).find(ok => ok.toLowerCase() === lowerK);
                    if (found) return obj[found];
                }
                return null;
            };

            return {
                question: getVal(item, ['question', 'q', 'text']) || "Question text unavailable",
                options: getVal(item, ['options', 'choices', 'answers']) || [],
                answer: getVal(item, ['correct_answer', 'answer', 'correct']) || "",
                explanation: getVal(item, ['explanation', 'reason']) || ""
            };
        });

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
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
            options: [`The fundamental principles of ${topic}`, `Advanced calculus`, `Historical events`, `Cooking recipes`],
            answer: `The fundamental principles of ${topic}`,
            explanation: `This is the definition of a core concept.`
        },
        {
            question: `How would you apply ${topic} in a real-world scenario?`,
            options: [`By ignoring it`, `Using constraints and models`, `Only in theory`, `By guessing`],
            answer: `Using constraints and models`,
            explanation: `Real-world application requires analysis of constraints.`
        },
        {
            question: `Which of these is related to ${topic}?`,
            options: [`Foundational Axioms`, `Unrelated Fact`, `Random Noise`, `False Statement`],
            answer: `Foundational Axioms`,
            explanation: `Axioms are the basis of the theory.`
        }
    ];
}

module.exports = { generateQuestions, getChatResponse };
