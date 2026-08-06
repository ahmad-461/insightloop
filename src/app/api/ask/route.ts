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

    const { question, schema, previousSql, errorMsg } = await req.json();

    if (!question || !schema) {
      return NextResponse.json(
        { error: "Question and dataset schema are required parameters." },
        { status: 400 }
      );
    }

    // Format schema for the prompt
    const schemaDetails = schema
      .map(
        (col: { sqlSafeName: string; displayName: string; currentType: string }) =>
          `- Column Name: "${col.sqlSafeName}" (Original display name: "${col.displayName}"), Type: ${col.currentType}`
      )
      .join("\n");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = "";
    if (previousSql && errorMsg) {
      // This is a correction/retry prompt
      prompt = `
You previously generated this SQL query:
\`\`\`sql
${previousSql}
\`\`\`

Executing that query on DuckDB returned this error:
"${errorMsg}"

Your task is to correct the SQL query so it runs successfully on DuckDB and answers the user's question: "${question}".

Remember these rules:
1. The DuckDB table name is exactly \`dataset\`.
2. Do NOT use standard SQL keywords like INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, ATTACH, COPY, PRAGMA. Only SELECT or WITH is allowed.
3. The available columns and types are:
${schemaDetails}
4. When selecting columns, always use double quotes around column names to avoid any syntax errors (e.g., SELECT "col_name" FROM dataset).
5. Only output a single valid DuckDB SQL SELECT query. Do not wrap it in markdown code blocks or add any explanatory text, commentary, or markdown formatting. Output raw SQL text only.
`;
    } else {
      // This is a fresh query generation
      prompt = `
You are an expert AI Data Analyst. Your task is to translate a user's natural language question into a single valid DuckDB SQL query.

The user's question is: "${question}"

Here is the DuckDB table details:
- Table name: \`dataset\`
- Column Schema:
${schemaDetails}

Strict rules for SQL generation:
1. ONLY output a single valid DuckDB SQL query.
2. The query must start with SELECT or WITH. Do NOT perform any mutations (no INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, ATTACH, COPY, PRAGMA).
3. Do NOT provide any explanation, markdown code fences (\`\`\`sql), backticks, or extra commentary. The response must be pure raw SQL text only.
4. When selecting columns, always wrap the column names in double quotes to prevent syntax issues with reserved words or special characters (e.g. SELECT "sql_safe_col" FROM dataset).
5. For date columns, use valid DuckDB strftime or Date operations if date manipulation is requested.
6. Keep queries as simple as possible.
7. Unless the query is clearly a summary or aggregate query (like COUNT, SUM, AVG), always include a limit of 100 rows (e.g. LIMIT 100) to keep results lightweight.

Generate the query now.
`;
    }

    const response = await model.generateContent(prompt);
    let generatedText = response.response.text() || "";

    // Clean up response if the model ignored instructions and wrapped it in code blocks
    generatedText = generatedText.trim();
    if (generatedText.startsWith("```")) {
      generatedText = generatedText.replace(/^```(sql|mysql|postgresql|sqlite|duckdb)?\n?/i, "");
      generatedText = generatedText.replace(/\n?```$/, "");
      generatedText = generatedText.trim();
    }
    // Handle stray backticks
    if (generatedText.startsWith("`") && generatedText.endsWith("`")) {
      generatedText = generatedText.replace(/^`|`$/g, "").trim();
    }

    return NextResponse.json({ sql: generatedText });
  } catch (error: unknown) {
    console.error("Error in /api/ask route:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred during SQL generation.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
