import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server. Please set GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    const { title, type, data } = await req.json();

    if (!title || !type || !data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: "Widget title, type, and data are required parameters." },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Limit dataset size for prompt safety
    const formattedData = JSON.stringify(data.slice(0, 50), null, 2);

    const prompt = `
You are an expert AI Data Analyst. You are explaining a single chart to a business user in a dashboard popover.

Chart Title: "${title}"
Chart Type: "${type}"
Chart Data (first 50 rows):
\`\`\`json
${formattedData}
\`\`\`

Your task:
Write an extremely concise 1-2 sentence explanation of what this chart shows.

Rules:
1. Speak in plain, professional, corporate natural language.
2. DO NOT use markdown of any kind (no bold asterisks, no headers, no bullet points, no backticks). Strictly plain text only.
3. Reference actual numbers, high/low values, and dates/categories from the provided data where possible (e.g., "Sales peaked in March at 45,000, which is 20% higher than average").
4. Keep the explanation strictly 1-2 sentences. Keep it fast and informative.
`;

    const response = await model.generateContent(prompt);
    const explanation = response.response.text() || "No explanation could be generated.";

    return NextResponse.json({ explanation: explanation.trim() });
  } catch (error: unknown) {
    console.error("Error in /api/explain-chart route:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred during results explanation.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
