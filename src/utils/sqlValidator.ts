/**
 * Validates a SQL query for safety.
 * Returns { isValid: boolean, error?: string, cleanSql?: string }.
 *
 * Rules:
 * 1. Strips leading comments and whitespace.
 * 2. Query must start with SELECT or WITH (case-insensitive).
 * 3. Query must not contain any forbidden mutating words (INSERT, UPDATE, DELETE, DROP,
 *    ALTER, CREATE, ATTACH, COPY, PRAGMA) as whole words (case-insensitive).
 */
export function cleanAndValidateSql(sql: string): { isValid: boolean; error?: string; cleanSql?: string } {
  // 1. Strip block comments: /* comment */
  let clean = sql.replace(/\/\*[\s\S]*?\*\//g, "");

  // 2. Strip line comments: -- comment
  clean = clean.split("\n")
    .map(line => {
      // Find the first index of '--' that is not inside quotes (simplified, but works for standard queries)
      // Standard splitting on '--' is sufficient for basic safety
      return line.split("--")[0];
    })
    .join("\n");

  // Trim leading and trailing whitespace
  clean = clean.trim();

  if (!clean) {
    return { isValid: false, error: "Query is empty." };
  }

  // 3. Must start with SELECT or WITH (case-insensitive)
  const startsWithSelectOrWith = /^(select|with)\b/i.test(clean);
  if (!startsWithSelectOrWith) {
    return {
      isValid: false,
      error: "Blocked query: For security, only SELECT and WITH queries are allowed.",
    };
  }

  // 4. Must not contain forbidden keywords as whole words (case-insensitive)
  const forbiddenKeywords = [
    "insert",
    "update",
    "delete",
    "drop",
    "alter",
    "create",
    "attach",
    "copy",
    "pragma"
  ];

  for (const kw of forbiddenKeywords) {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    if (regex.test(clean)) {
      return {
        isValid: false,
        error: `Security violation: Forbidden keyword '${kw.toUpperCase()}' detected. The query was rejected.`,
      };
    }
  }

  return { isValid: true, cleanSql: clean };
}
