/**
 * Helper to generate a unique UUID v4.
 * Uses window.crypto if available, falling back to a pure JS random implementation.
 */
export function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  // Fallback UUID v4 generator
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets or creates an anonymous session ID stored in a cookie.
 * Ensures long expiry (e.g., 1 year) and handles potential blockages gracefully.
 */
export function getOrCreateSessionId(): string {
  if (typeof document === "undefined") {
    return "";
  }

  const cookieName = "insightloop_session_id=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieParts = decodedCookie.split(";");

  for (let i = 0; i < cookieParts.length; i++) {
    let part = cookieParts[i];
    while (part.charAt(0) === " ") {
      part = part.substring(1);
    }
    if (part.indexOf(cookieName) === 0) {
      return part.substring(cookieName.length, part.length);
    }
  }

  // Generate new session ID
  const newSessionId = generateUUID();
  const oneYearExpiry = new Date();
  oneYearExpiry.setTime(oneYearExpiry.getTime() + 365 * 24 * 60 * 60 * 1000);
  const expires = "expires=" + oneYearExpiry.toUTCString();

  // Set cookie with SameSite=Lax and Secure if not local
  document.cookie = `insightloop_session_id=${newSessionId};${expires};path=/;SameSite=Lax`;

  return newSessionId;
}
