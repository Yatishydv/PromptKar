const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

async function listModels() {
  if (!apiKey) {
    console.error("No API key found in .env.local");
    return;
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // Note: The Node.js SDK doesn't have a direct 'listModels' in the client usually, 
    // it's part of the GenerativeAI interface but sometimes not exposed in the same way.
    // Let's try a simple generation with a known model to see if it's a key issue.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("Gemini 1.5 Flash is WORKING!");
  } catch (error) {
    console.error("Gemini 1.5 Flash FAILED:", error.message);
    
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("test");
        console.log("Gemini Pro (1.0) is WORKING!");
    } catch (e2) {
        console.error("Gemini Pro (1.0) FAILED:", e2.message);
    }
  }
}

listModels();
