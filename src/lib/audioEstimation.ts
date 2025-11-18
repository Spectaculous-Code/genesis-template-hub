/**
 * Audio estimation utilities for calculating listening time
 */

// Average speaking rate in words per minute
const WORDS_PER_MINUTE = 150;

/**
 * Count words in text
 */
export const countWords = (text: string): number => {
  if (!text || text.trim() === '') return 0;
  // Split by whitespace and filter out empty strings
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

/**
 * Calculate estimated listening time in seconds based on word count
 */
export const estimateListeningTime = (wordCount: number): number => {
  if (wordCount === 0) return 0;
  return Math.ceil((wordCount / WORDS_PER_MINUTE) * 60);
};

/**
 * Format seconds to human-readable time string
 * Examples:
 * - 45 seconds -> "< 1 min"
 * - 120 seconds -> "2 min"
 * - 185 seconds -> "3 min"
 * - 1200 seconds -> "20 min"
 */
export const formatListeningTime = (seconds: number): string => {
  if (seconds < 60) {
    return "< 1 min";
  }
  
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
};

/**
 * Calculate estimated listening time from text
 * Returns formatted string like "3 min" or "< 1 min"
 */
export const getEstimatedTimeFromText = (text: string): string => {
  const wordCount = countWords(text);
  const seconds = estimateListeningTime(wordCount);
  return formatListeningTime(seconds);
};

/**
 * Calculate estimated listening time for multiple verses
 */
export const getChapterEstimatedTime = (verses: Array<{ text: string }>): string => {
  const totalText = verses.map(v => v.text).join(' ');
  return getEstimatedTimeFromText(totalText);
};
