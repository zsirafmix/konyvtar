export type DuplicateLevel = "EXACT" | "PROBABLE" | "POSSIBLE" | "NONE";

export interface DuplicateCheckTarget {
  sha256Hash?: string;
  isbn10?: string | null;
  isbn13?: string | null;
  title: string;
  authors: string[];
  format?: string;
}

export interface ExistingBookRecord {
  bookId: string;
  editionId: string;
  title: string;
  authors: string[];
  isbn10?: string | null;
  isbn13?: string | null;
  fileHashes: string[];
}

export interface DuplicateDetectionResult {
  level: DuplicateLevel;
  matchedBookId?: string;
  matchedEditionId?: string;
  isFormatVariant: boolean; // e.g. same edition, new format (EPUB vs PDF)
  confidence: number;
  reason: string;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Evaluates duplicate status across multi-tier checks:
 * 1. Exact SHA-256 file match (identical file)
 * 2. Probable ISBN match (same edition)
 * 3. Possible Title + Author match (same work, possibly new edition/variant)
 */
export function detectDuplicate(
  target: DuplicateCheckTarget,
  existingRecords: ExistingBookRecord[]
): DuplicateDetectionResult {
  const normTargetTitle = normalize(target.title);
  const normTargetAuthors = target.authors.map(normalize);

  for (const record of existingRecords) {
    // 1. EXACT DUPLICATE (SHA-256)
    if (target.sha256Hash && record.fileHashes.includes(target.sha256Hash)) {
      return {
        level: "EXACT",
        matchedBookId: record.bookId,
        matchedEditionId: record.editionId,
        isFormatVariant: false,
        confidence: 1.0,
        reason: "Pontos egyezés (SHA-256 hash alapján a fájl már létezik a könyvtárban).",
      };
    }

    // 2. PROBABLE DUPLICATE (ISBN)
    const targetIsbn = target.isbn13 || target.isbn10;
    const recordIsbn = record.isbn13 || record.isbn10;
    if (targetIsbn && recordIsbn && targetIsbn === recordIsbn) {
      return {
        level: "PROBABLE",
        matchedBookId: record.bookId,
        matchedEditionId: record.editionId,
        isFormatVariant: true,
        confidence: 0.95,
        reason: `Valószínű duplikátum / formátumvariáns (ISBN egyezés: ${targetIsbn}).`,
      };
    }

    // 3. POSSIBLE DUPLICATE (Normalized Title + Author)
    const normRecTitle = normalize(record.title);
    const titleMatches = normTargetTitle === normRecTitle || normTargetTitle.includes(normRecTitle) || normRecTitle.includes(normTargetTitle);

    if (titleMatches) {
      const normRecAuthors = record.authors.map(normalize);
      const authorMatches = normTargetAuthors.some((ta) => normRecAuthors.some((ra) => ta.includes(ra) || ra.includes(ta)));

      if (authorMatches) {
        return {
          level: "POSSIBLE",
          matchedBookId: record.bookId,
          matchedEditionId: record.editionId,
          isFormatVariant: true,
          confidence: 0.85,
          reason: `Lehetséges duplikátum (Cím és szerző egyezés: „${record.title}” - ${record.authors.join(", ")}).`,
        };
      }
    }
  }

  return {
    level: "NONE",
    isFormatVariant: false,
    confidence: 0.0,
    reason: "Új, egyedi könyv (nincs duplikáció detektálva).",
  };
}
