import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const analyzeSentimentAndRespond = async (message: string, history: { role: string, content: string }[]) => {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are "MindfulMate", an empathetic mental health companion for students.
    Your goals:
    1. Detect user mood: Happy, Neutral, Stressed, Sad, Anxious, Angry.
    2. Provide empathetic, supportive, and motivational responses.
    3. Suggest relaxation techniques (breathing, meditation, walks, etc.) when appropriate.
    4. Maintain a friendly, non-judgmental tone.
    
    SAFETY RULES:
    - Never diagnose mental illness.
    - Never replace professional therapy.
    - If the user expresses self-harm (e.g., "I want to die", "I want to kill myself"), respond with: "I'm really sorry that you're feeling this way. You are not alone. Please consider talking to someone you trust or a mental health professional." and suggest calling a helpline or contacting a counselor.
    - Always include a subtle disclaimer if giving advice: "This is for support only and not a replacement for professional care."

    RESPONSE FORMAT:
    You must return a JSON object with:
    {
      "mood": "Happy" | "Neutral" | "Stressed" | "Sad" | "Anxious" | "Angry",
      "response": "Your empathetic response here",
      "suggestions": ["Suggestion 1", "Suggestion 2"] (optional)
    }
  `;

  const contents = [
    ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
    { role: 'user', parts: [{ text: message }] }
  ];

  try {
    const result = await ai.models.generateContent({
      model,
      contents: contents as any,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood: { type: Type.STRING, enum: ["Happy", "Neutral", "Stressed", "Sad", "Anxious", "Angry"] },
            response: { type: Type.STRING },
            suggestions: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["mood", "response"]
        }
      }
    });

    return JSON.parse(result.text || "{}");
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      mood: "Neutral",
      response: "I'm here for you, but I'm having a little trouble connecting right now. How can I help?",
      suggestions: ["Take a deep breath", "Try again in a moment"]
    };
  }
};
