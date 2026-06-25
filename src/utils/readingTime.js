const WORDS_PER_MINUTE = 200;

/**
 * Estimates reading time in minutes for a given text.
 * @param {string} text
 * @returns {number} Reading time in minutes (minimum 1)
 */
export function calculateReadingTime(text = "") {
  if (!text || typeof text !== "string") return 1;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(wordCount / WORDS_PER_MINUTE);
  return Math.max(1, minutes);
}
