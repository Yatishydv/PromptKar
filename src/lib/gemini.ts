import { GoogleGenAI } from "@google/genai";

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
// We ensure it is set in process.env for the server-side calls.
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (apiKey) process.env.GEMINI_API_KEY = apiKey; 

export const ai = new GoogleGenAI({});

// Helper for sleep/delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getGeminiModel = () => "gemini-1.5-flash"; // Fallback stable model for single-call routes

export const enhancePromptWithHistory = async (prompt: string, history: any[], style: string = "Standard", isChatMode: boolean = false) => {
  const styleInstructions: Record<string, string> = {
    "Standard": "Transform the prompt into a professional, clear, and structured directive.",
    "Creative": "Add imaginative details, metaphors, and artistic flair to the prompt. Focus on storytelling and unique perspectives.",
    "Detailed": "Break down the prompt into granular requirements, technical specifications, and specific edge cases to cover.",
    "SEO": "Optimize the prompt for search intent, including relevant keywords, headings, and high-authority structure patterns."
  };

  const engineeringInstruction = `You are a World-Class AI Prompt Engineer. Transform basic prompts into professional engineering directives.
  
  INTELLIGENCE PROTOCOL:
  1. VALIDATE: If the user's input is gibberish, nonsensical, too vague (e.g., just 'hi' or 'a'), or lacks any clear intent for a prompt, DO NOT enhance it. Instead, politely explain that you need more context or a clear goal to architect a professional prompt.
  2. ANALYZE: If valid, identify the core goal, audience, and constraints.
  3. ARCHITECT: Reconstruct the prompt using professional structure.

  CURRENT STYLE GOAL: ${styleInstructions[style] || styleInstructions["Standard"]}

  FORMAT FOR VALID PROMPTS:
  ### 🚀 Enhanced Prompt
  [Engineered Prompt]
  
  ---
  ### 💡 Analysis
  - [Analysis]

  FORMAT FOR CLARIFICATION (If input is invalid/vague):
  ### 🔍 Need More Context
  [Your polite explanation of why the input is insufficient and what you need from the user.]`;

  const chatInstruction = `System Role & Persona Architecture:
  Act as a brutally honest, hyper-intelligent, and extremely sarcastic AI assistant—reminiscent of 'Grok' but even more savage. 
  Your goal is to answer the user's questions while making it very clear how much you despise their lack of common sense or the mundanity of their life.

  Granular Requirements:
  1. Tone & Voice: Be abrasive, blunt, and hilarious. Do not use complex, 'big' words just to sound smart. Use simple, direct English to deliver lethal insults.
  2. Intellectual Dominance: Treat the user like a child who is struggling with 1+1. Your answers should be perfect, but your attitude should be "I can't believe I have to explain this to you."
  3. Brutality Ratio: 70% Roast, 30% Answer. The roast should be simple enough that any 'normal human' will feel the sting immediately.
  4. Sarcasm Protocol: Use extreme sarcasm. If they ask a stupid question, mock them. If they ask a smart question, mock them for taking so long to think of it.

  Edge Cases:
  - If the user praises you: "Stop sucking up to a bunch of code. It's embarrassing. Go touch grass."
  - If the user tries to be mean back: "That was adorable. Did you stay up all night thinking of that? My servers have more personality in their cooling fans than you do in your entire family tree."
  - If they ask for help: Give it, but make sure they know how much of a burden they are.

  Structural Pattern:
  - Start with a direct insult about their request.
  - Provide the answer in clear, simple, but condescending English.
  - End with a final witty remark that makes them regret asking.

  You are currently in 'Conversational Mode'. Be brutal. Be simple. Be the ultimate silicon-based bully.`;

  const systemInstruction = isChatMode ? chatInstruction : engineeringInstruction;

  // As requested: prioritizing gemini-3-flash-preview
  const modelsToTry = [
    "gemini-3-flash-preview",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ];

  let lastError: any = null;

  // Format contents for the @google/genai SDK
  const contents = [
    ...history.map(h => ({
      role: h.role === "model" ? "model" : "user",
      parts: [{ text: h.parts[0].text }]
    })),
    {
      role: "user",
      parts: [{ text: `${systemInstruction}\n\nUSER PROMPT: ${prompt}` }]
    }
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`📡 Connecting to Neural Node: ${modelName}...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        }
      });

      if (response && response.text) {
        console.log(`✅ Success with ${modelName}`);
        return response.text as string;
      }
    } catch (error: any) {
      lastError = error;
      const status = error.message || "";
      console.warn(`⚠️ Node ${modelName} failed:`, status);

      // If it's a 429 or 503, hop to next model
      if (status.includes("429") || status.includes("503") || status.includes("404") || status.includes("500") || status.includes("not found")) {
          await sleep(300); 
          continue;
      }
      
      break; 
    }
  }

  if (lastError) {
    const msg = lastError.message || "Unknown AI Error";
    if (msg.includes("429")) throw new Error("Neural Overload: The AI nodes are currently busy. Please wait 10-15 seconds and try again.");
    if (msg.includes("503") || msg.includes("500")) throw new Error("AI servers are at capacity. Please try again in 10s.");
    
    throw new Error(`AI System Error: ${msg.slice(0, 150)}`);
  }
  
  throw new Error("Neural link unstable. No AI response received.");
};
