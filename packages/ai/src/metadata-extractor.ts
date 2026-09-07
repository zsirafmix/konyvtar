export interface ExtractedMetadata {
  rawFilename: string;
  title: string;
  author?: string;
  series?: string;
  seriesNumber?: number;
  year?: number;
  language?: string;
  format?: string;
  titleConfidence: number;
  authorConfidence: number;
  seriesConfidence: number;
  overallConfidence: number;
}

const NOISE_REGEX = /\b(scan|final|v\d+|retail|repack|z-lib|annas-archive|libgen|unabridged|audiobook|hq|ebook|ed|edition)\b/gi;
const BRACKET_TAGS_REGEX = /\[[^\]]+\]|\([^)]+\)/g;

/**
 * Extracts book title, author, series, volume number, and year from a raw filename.
 */
export function extractMetadataFromFilename(filename: string): ExtractedMetadata {
  // Remove file extension
  const parts = filename.split(".");
  const format = parts.length > 1 ? parts.pop()?.toUpperCase() : "EPUB";
  let cleanName = parts.join(".");

  // Extract year if present (e.g. 1951 or 2023)
  let year: number | undefined;
  const yearMatch = cleanName.match(/\b(18\d{2}|19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
  }

  // Remove noise words
  cleanName = cleanName.replace(NOISE_REGEX, "");

  // Detect series pattern: e.g. [Foundation 01] or Series - 01 -
  let series: string | undefined;
  let seriesNumber: number | undefined;
  let seriesConfidence = 0.5;

  const seriesBracketMatch = cleanName.match(/\[([a-zA-Z\s]+)\s*#?0?(\d+)\]/i);
  if (seriesBracketMatch) {
    series = seriesBracketMatch[1].trim();
    seriesNumber = parseInt(seriesBracketMatch[2], 10);
    seriesConfidence = 0.88;
  }

  // Remove bracket tags
  cleanName = cleanName.replace(BRACKET_TAGS_REGEX, " ");

  // Normalize delimiters: replace underscores, extra dashes, dots with spaces
  cleanName = cleanName.replace(/[_\.]/g, " ").replace(/\s+/g, " ").trim();

  let author: string | undefined;
  let title = cleanName;
  let authorConfidence = 0.5;
  let titleConfidence = 0.6;

  // Check hyphen-separated format: e.g. "Isaac Asimov - Foundation" or "Isaac Asimov - Foundation 1 - The Psychohistorians"
  if (cleanName.includes(" - ")) {
    const segments = cleanName.split(" - ").map((s) => s.trim()).filter(Boolean);
    if (segments.length === 2) {
      author = segments[0];
      title = segments[1];
      authorConfidence = 0.92;
      titleConfidence = 0.94;
    } else if (segments.length >= 3) {
      author = segments[0];
      // Check if middle segment is series
      const middleSeries = segments[1].match(/(.+?)\s*#?0?(\d+)/);
      if (middleSeries) {
        series = middleSeries[1].trim();
        seriesNumber = parseInt(middleSeries[2], 10);
        seriesConfidence = 0.9;
      }
      title = segments.slice(2).join(" - ");
      authorConfidence = 0.9;
      titleConfidence = 0.9;
    }
  } else {
    // Single string without hyphen: e.g. "Isaac Asimov Foundation"
    // Heuristic: If first 2 words looks like a name (capital letters), split
    const words = cleanName.split(" ");
    if (words.length >= 3) {
      // Check for known common author prefixes
      author = `${words[0]} ${words[1]}`;
      title = words.slice(2).join(" ");
      authorConfidence = 0.78;
      titleConfidence = 0.82;
    } else if (words.length === 2) {
      title = cleanName;
      titleConfidence = 0.75;
      authorConfidence = 0.4;
    } else {
      title = cleanName;
      titleConfidence = 0.6;
      authorConfidence = 0.3;
    }
  }

  // Clean title & author strings
  title = title.replace(/\b(18\d{2}|19\d{2}|20\d{2})\b/g, "").replace(/\s+/g, " ").trim();
  if (author) {
    author = author.replace(/\b(18\d{2}|19\d{2}|20\d{2})\b/g, "").replace(/\s+/g, " ").trim();
  }

  // Calculate overall confidence
  const overallConfidence = parseFloat(
    ((titleConfidence * 0.4 + authorConfidence * 0.4 + (series ? seriesConfidence : 0.8) * 0.2)).toFixed(2)
  );

  return {
    rawFilename: filename,
    title: title || "Ismeretlen könyv",
    author,
    series,
    seriesNumber,
    year,
    format,
    language: "hu", // Default library preference
    titleConfidence,
    authorConfidence,
    seriesConfidence: series ? seriesConfidence : 0.0,
    overallConfidence,
  };
}
