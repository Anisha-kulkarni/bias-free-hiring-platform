import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY || ''; // Ensure API_KEY is set in environment
  return new GoogleGenAI({ apiKey });
};

export const generateMentorResponse = async (history: {role: string, text: string}[], message: string) => {
  try {
    const ai = getClient();
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "You are Antigravity's Mentor Bot. You are a helpful, encouraging, and concise tutor for students. You help with math, science, and study habits. Keep answers short and engaging.",
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having a little trouble connecting to the knowledge base right now. Try again in a moment!";
  }
};

export const generateScenario = async (topic: string, interest: string) => {
  try {
    const ai = getClient();
    const prompt = `Create a short, engaging learning scenario or word problem for the topic "${topic}" tailored to a student interested in "${interest}". Keep it under 50 words.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Scenario Error:", error);
    return `Imagine you are solving ${topic} while doing your favorite activity: ${interest}.`;
  }
};