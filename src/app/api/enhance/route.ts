import { NextRequest, NextResponse } from "next/server";
import { ai, getGeminiModel, isAiConfigured } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    if (!isAiConfigured) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not defined in environment variables. Please check your deployment (Vercel/Render) configuration." },
        { status: 500 }
      );
    }
    const { prompt, option } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    let instruction = "";
    switch (option) {
      case "seo":
        instruction = "Improve this AI prompt to be SEO optimized. Focus on keywords, clarity, and search intent.";
        break;
      case "creative":
        instruction = "Improve this AI prompt to be more creative and imaginative. Use descriptive language and unique angles.";
        break;
      case "detailed":
        instruction = "Improve this AI prompt to be highly detailed and specific. Include technical parameters, style references, and clear constraints.";
        break;
      default:
        instruction = "Improve this AI prompt to be more effective and professional.";
    }

    const fullPrompt = `${instruction}\n\nOriginal Prompt: "${prompt}"\n\nImproved Prompt:`;

    const response = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }]
    });

    return NextResponse.json({ improvedPrompt: response.text });
  } catch (error: any) {
    console.error("AI Enhancement Error:", error);
    return NextResponse.json(
      { error: "Failed to enhance prompt. Please check your API key." },
      { status: 500 }
    );
  }
}
