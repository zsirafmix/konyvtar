/**
 * XSS and Input Sanitization utility for user-generated content
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

/**
 * Escapes HTML characters completely to render as safe plain text.
 */
export function escapeHtml(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Strips all HTML tags and attributes, returning clean text.
 */
export function stripHtml(str: string): string {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/**
 * Sanitizes forum and chat text:
 * - strips dangerous executable elements (script, iframe, object, embed, event handlers)
 * - normalizes whitespace
 * - preserves safe plain text
 */
export function sanitizeUserContent(content: string, maxLength: number = 10000): string {
  if (!content || typeof content !== "string") return "";
  let clean = content.trim();

  // Strip scripts, inline handlers like onload=, onerror=, and javascript: pseudo-protocol
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
  clean = clean.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "");
  clean = clean.replace(/javascript:/gi, "");
  clean = clean.replace(/data:\s*text\/html/gi, "");
  clean = clean.replace(/on\w+\s*=\s*(['"]).*?\1/gi, "");
  clean = clean.replace(/on\w+\s*=\s*[^>\s]+/gi, "");

  // Strip remaining HTML tags
  clean = clean.replace(/<[^>]+>/g, "");

  if (clean.length > maxLength) {
    clean = clean.substring(0, maxLength);
  }

  return clean;
}

/**
 * Validates and sanitizes a username/display name (alphanumeric, spaces, hungarian diacritics, 2-50 chars)
 */
export function sanitizeDisplayName(name: string): string {
  if (!name || typeof name !== "string") return "Felhasználó";
  const stripped = stripHtml(name).trim();
  const cleaned = stripped.replace(/[^a-zA-Z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ\s_.-]/g, "");
  return cleaned.substring(0, 50) || "Felhasználó";
}
