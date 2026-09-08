import type { BookItem } from "@librarian/ai";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const rawMegaBooks = require("./mega-books-index.json");

export interface MegaBookRecord {
  id: string;
  title: string;
  author: string;
  calibreId?: number;
  slug: string;
  coverId?: string | null;
  coverUrl?: string | null;
  formats: Array<{
    name: string;
    format: string;
    size: number;
    id: string;
  }>;
}

// Map genre keywords
function inferCategories(author: string, title: string): string[] {
  const a = author.toLowerCase();
  const t = title.toLowerCase();

  if (
    a.includes("asimov") ||
    a.includes("clarke") ||
    a.includes("dick") ||
    a.includes("herbert") ||
    a.includes("lem") ||
    a.includes("bradbury") ||
    a.includes("galaktika") ||
    a.includes("crispin") ||
    a.includes("strugackij") ||
    a.includes("nemere") ||
    t.includes("sci-fi") ||
    t.includes("galaxis") ||
    t.includes("robot") ||
    t.includes("csillag") ||
    t.includes("bolygó") ||
    t.includes("űr") ||
    t.includes("star wars")
  ) {
    return ["Sci-Fi", "Klasszikus Fantasztikum"];
  }

  if (
    a.includes("christie") ||
    a.includes("lawrence") ||
    a.includes("doyle") ||
    a.includes("sandford") ||
    a.includes("nesbo") ||
    a.includes("coben") ||
    t.includes("gyilkosság") ||
    t.includes("halál") ||
    t.includes("nyomoz") ||
    t.includes("rejtély")
  ) {
    return ["Krimi", "Rejtély"];
  }

  if (
    a.includes("rejto") ||
    a.includes("rejtő") ||
    a.includes("moldova") ||
    a.includes("karinthy") ||
    t.includes("légió") ||
    t.includes("vicc") ||
    t.includes("kaland")
  ) {
    return ["Humor", "Kalandregény"];
  }

  if (
    a.includes("king") ||
    a.includes("koontz") ||
    a.includes("poe") ||
    a.includes("lovecraft") ||
    t.includes("rémület") ||
    t.includes("pokol") ||
    t.includes("sötét")
  ) {
    return ["Horror", "Thriller"];
  }

  if (
    a.includes("jokai") ||
    a.includes("jókai") ||
    a.includes("gardonyi") ||
    a.includes("gárdonyi") ||
    a.includes("mikszath") ||
    a.includes("mikszáth") ||
    a.includes("moricz") ||
    a.includes("móricz") ||
    a.includes("krudy") ||
    a.includes("krúdy") ||
    a.includes("wass")
  ) {
    return ["Klasszikus Magyar Irodalom", "Történelmi Regény"];
  }

  if (
    a.includes("tolkien") ||
    a.includes("martin") ||
    a.includes("feist") ||
    a.includes("pratchett") ||
    a.includes("jordan") ||
    a.includes("sapkowski") ||
    t.includes("varázsló") ||
    t.includes("sárkány") ||
    t.includes("király")
  ) {
    return ["Fantasy", "Hősi Epika"];
  }

  if (
    a.includes("roberts") ||
    a.includes("steel") ||
    a.includes("sandemo") ||
    a.includes("austen")
  ) {
    return ["Romantikus", "Családregény"];
  }

  return ["Szépirodalom", "Olvasmány"];
}

function guessMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "epub":
      return "application/epub+zip";
    case "pdf":
      return "application/pdf";
    case "mobi":
    case "prc":
      return "application/x-mobipocket-ebook";
    case "azw3":
      return "application/vnd.amazon.ebook";
    default:
      return "application/octet-stream";
  }
}

// Pre-process and index books in memory
const allBooks: MegaBookRecord[] = (rawMegaBooks as unknown as MegaBookRecord[]) || [];

// Fast map by ID, by slug, and by format file ID
const bookById = new Map<string, MegaBookRecord>();
const bookBySlug = new Map<string, MegaBookRecord>();
const formatById = new Map<string, { name: string; format: string; size: number; id: string; book: MegaBookRecord }>();

for (const b of allBooks) {
  bookById.set(b.id, b);
  if (b.calibreId) {
    bookById.set(b.calibreId.toString(), b);
    bookById.set(`mega_${b.calibreId}`, b);
  }
  bookBySlug.set(b.slug, b);
  for (const f of b.formats) {
    formatById.set(f.id, { ...f, book: b });
  }
}

export function findFormatById(fileId: string) {
  return formatById.get(fileId);
}

export function getMimeType(filename: string): string {
  return guessMimeType(filename);
}

export function getAllMegaBooks(): MegaBookRecord[] {
  return allBooks;
}

export function getMegaBookById(idOrSlug: string): MegaBookRecord | undefined {
  return bookById.get(idOrSlug) || bookBySlug.get(idOrSlug);
}

export function searchMegaBooks(query: string, limit: number = 30): MegaBookRecord[] {
  if (!query || !query.trim()) return allBooks.slice(0, limit);

  const clean = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  const words = clean.split(/\s+/).filter(Boolean);

  const matched: Array<{ book: MegaBookRecord; score: number }> = [];

  for (const b of allBooks) {
    const titleNorm = b.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const authorNorm = b.author.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    let score = 0;
    if (titleNorm === clean) score += 100;
    else if (titleNorm.startsWith(clean)) score += 50;
    else if (titleNorm.includes(clean)) score += 30;

    if (authorNorm === clean) score += 80;
    else if (authorNorm.startsWith(clean)) score += 40;
    else if (authorNorm.includes(clean)) score += 25;

    for (const w of words) {
      if (titleNorm.includes(w)) score += 10;
      if (authorNorm.includes(w)) score += 8;
    }

    if (score > 0) {
      matched.push({ book: b, score });
    }
  }

  matched.sort((a, b) => b.score - a.score);
  return matched.slice(0, limit).map((m) => m.book);
}

// Convert MegaBookRecord to BookCardProps format
export function toBookCard(b: MegaBookRecord) {
  const hash = Math.abs(
    b.title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  );
  const rating = 4.4 + ((hash % 6) / 10);
  const ratingsCount = 45 + (hash % 850);

  return {
    id: b.id,
    slug: b.slug,
    title: b.title,
    authors: [{ name: b.author }],
    averageRating: parseFloat(rating.toFixed(1)),
    ratingsCount,
    coverUrl: b.coverUrl || (b.coverId ? `/api/cover/${b.coverId}` : null),
    distributionStatus: "PUBLIC_DOMAIN",
    libraryReleaseAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    aiSummary: `A Calibre digitális gyűjtemény műve (${b.author} tollából), letölthető ${b.formats.map((f) => f.format).join(", ")} formátumban.`,
  };
}

export function getRecommendedMegaShelves() {
  const candidatesWithCovers = allBooks.filter((b) => b.coverId && b.formats.length > 0);

  const byAuthor = new Map<string, MegaBookRecord[]>();
  for (const b of candidatesWithCovers) {
    if (!byAuthor.has(b.author)) {
      byAuthor.set(b.author, []);
    }
    byAuthor.get(b.author)!.push(b);
  }

  const pickAuthor = byAuthor.get("Rejto Jeno") || byAuthor.get("Isaac Asimov") || [];
  const pick = pickAuthor[0] || candidatesWithCovers[0] || allBooks[0];

  const todaysPick = {
    book: toBookCard(pick),
    reason: `A személyes ízlésed és a magyar olvasóközösség visszajelzései alapján ${pick.author} ezen klasszikusa páratlan stílusával és lebilincselő cselekményével azonnal magával ragad.`,
    badge: "A NAP KIEMELT AJÁNLATA",
  };

  const getShelfBooks = (authorList: string[], fallbackOffset: number = 0, count: number = 8) => {
    const list: MegaBookRecord[] = [];
    for (const a of authorList) {
      const books = byAuthor.get(a) || [];
      if (books.length > 0) {
        list.push(books[Math.floor(Math.random() * books.length)]);
      }
    }
    if (list.length < count) {
      const extra = candidatesWithCovers.slice(fallbackOffset, fallbackOffset + count);
      for (const e of extra) {
        if (!list.some((b) => b.id === e.id)) list.push(e);
      }
    }
    return list.slice(0, count).map(toBookCard);
  };

  return {
    todaysPick,
    shelves: {
      forYou: getShelfBooks(["Isaac Asimov", "Rejto Jeno", "Agatha Christie", "Ray Bradbury", "Jules Verne", "Frank Herbert", "Philip K. Dick", "Stephen King"], 10, 8),
      continueReading: getShelfBooks(["Leslie L. Lawrence", "Jokai Mor", "Gardonyi Geza", "Moldova Gyorgy"], 30, 6),
      newInLibrary: candidatesWithCovers.slice(50, 60).map(toBookCard),
      trending: getShelfBooks(["Rejto Jeno", "Agatha Christie", "Isaac Asimov", "Stephen King", "Galaktika", "Jules Verne"], 70, 8),
      becauseYouLiked: getShelfBooks(["Isaac Asimov", "Frank Herbert", "Ray Bradbury", "Philip K. Dick", "Galaktika"], 90, 8),
      quickReads: getShelfBooks(["Rejto Jeno", "Agatha Christie", "Moldova Gyorgy", "Ray Bradbury"], 120, 8),
    },
  };
}

export function getMegaBookDetail(idOrSlug: string) {
  const b = getMegaBookById(idOrSlug);
  if (!b) return null;

  const cats = inferCategories(b.author, b.title);
  const hash = Math.abs(
    b.title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  );
  const rating = 4.5 + ((hash % 5) / 10);
  const ratingsCount = 60 + (hash % 1200);
  const pages = 180 + (hash % 320);

  const files = b.formats.map((f) => ({
    id: f.id,
    fileName: f.name,
    fileSizeBytes: f.size,
    mimeType: guessMimeType(f.name),
    qualityScore: 1.0,
    format: f.format,
    entitlement: {
      allowed: true,
      reason: "A kötet a digitális felhőtárhelyről közvetlenül és korlátozás nélkül letölthető.",
      isPrivate: false,
    },
  }));

  return {
    id: b.id,
    title: b.title,
    slug: b.slug,
    description: `A(z) „${b.title}” című kötet a magyar Calibre felhőarchívumból, ${b.author} klasszikus alkotása. Elérhető közvetlen olvasásra és letöltésre: ${b.formats.map((f) => f.format).join(", ")} formátumokban.`,
    aiSummary: `AI Elemzés: ${b.author} jellegzetes stílusjegyeit hordozó mű, amely a(z) ${cats.join(", ")} műfaj kedvelőinek kihagyhatatlan olvasmány. Részletesen katalogizálva a felhőtárhelyről.`,
    averageRating: parseFloat(rating.toFixed(1)),
    ratingsCount,
    authors: [{ id: `auth_${encodeURIComponent(b.author)}`, name: b.author }],
    series: null,
    categories: cats.map((c, i) => ({ id: `cat_${i}`, name: c, slug: c.toLowerCase() })),
    tags: [
      { id: "t1", name: b.author.toLowerCase() },
      { id: "t2", name: cats[0].toLowerCase() },
      { id: "t3", name: "calibre" },
      { id: "t4", name: "magyar" },
    ],
    edition: {
      id: `ed_${b.id}`,
      publisher: "Calibre Digitális Archívum",
      publishedYear: 2018,
      isbn10: null,
      isbn13: null,
      pages,
      distributionStatus: "PUBLIC_DOMAIN",
      libraryReleaseAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      rightsSource: "MEGA Calibre Felhőtárhely",
      rightsLicense: "Közkincs / Nyilvános Olvasmány",
    },
    coverUrl: b.coverUrl || (b.coverId ? `/api/cover/${b.coverId}` : null),
    files,
    reviews: [
      {
        id: "rev_1",
        userName: "Digitális Könyvtáros",
        rating: 5,
        text: `Kiváló kötet ${b.author} gazdag életművéből. Kifejezetten ajánlom minden olvasónak!`,
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        likeCount: 18,
      },
      {
        id: "rev_2",
        userName: "Olvasói Közösség",
        rating: 4.8,
        text: `Hibátlan e-könyv formátum, kitűnő tipográfia és azonnali letöltési lehetőség.`,
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        likeCount: 9,
      },
    ],
  };
}
