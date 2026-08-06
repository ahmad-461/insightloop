import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API with key from env
const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server. Please set GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    const { question, sql, results } = await req.json();

    if (!question || !sql || !results) {
      return NextResponse.json(
        { error: "Question, sql query, and execution results are required parameters." },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Format results nicely for prompt context (limit size to prevent context overflow)
    const formattedResults = JSON.stringify(results.slice(0, 50), null, 2);

    const prompt = `
You are an expert AI Data Analyst. You have just run a SQL query to answer a user's question.

User's Question: "${question}"
Executed SQL Query:
\`\`\`sql
${sql}
\`\`\`

Query Execution Results (first 50 rows):
\`\`\`json
${formattedResults}
\`\`\`

Your task:
Write a plain, conversational explanation of the results (2-4 sentences max).
Rules:
1. Explain the answer directly in natural, human-friendly language.
2. DO NOT use SQL jargon, column name references like "col_name", or database terminology.
3. Mention actual specific numbers, categories, or names from the result payload to answer the question clearly.
4. Keep the tone professional, concise, and helpful.
`;

    const response = await model.generateContent(prompt);
    const explanation = response.response.text() || "No explanation could be generated.";

    return NextResponse.json({ explanation: explanation.trim() });
  } catch (error: unknown) {
    console.error("Error in /api/explain route:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred during results explanation.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
