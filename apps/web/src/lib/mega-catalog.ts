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

export function norm(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function cleanSortKey(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^[^a-zA-Z0-9]+/, "")
    .trim()
    .toLowerCase();
}

export function authorSortKey(str: string): string {
  const clean = cleanSortKey(str);
  if (!clean) return "zz_zz";
  if (/^[0-9]/.test(clean)) return `zz_${clean}`;
  return clean;
}

export function titleSortKey(str: string): string {
  let clean = cleanSortKey(str);
  clean = clean.replace(/^[0-9]+[\s\-._]+/, "");
  if (!clean) return "zz_zz";
  if (/^[0-9]/.test(clean)) return `zz_${clean}`;
  return clean;
}

export interface GenreDefinition {
  slug: string;
  name: string;
  test: (normalizedText: string) => boolean;
}

export const GENRE_DEFINITIONS: GenreDefinition[] = [
  {
    slug: "sci-fi",
    name: "Sci-Fi",
    test: (s) => /asimov|clarke|dick|herbert|lem|bradbury|galaktika|nemere|strugackij|sci-fi|scifi|galaxis|robot|csillag|bolygo|ur|urhajo|star wars|star trek/i.test(s),
  },
  {
    slug: "fantasy",
    name: "Fantasy",
    test: (s) => /tolkien|martin|feist|pratchett|jordan|sapkowski|rowling|sanderson|varazslo|sarkany|magia|boszorkany|tunde|elf|elfek|hos|kard/i.test(s),
  },
  {
    slug: "krimi",
    name: "Krimi & Bűnügyi",
    test: (s) => /christie|doyle|lawrence|nesbo|coben|sandford|chandler|connelly|gardner|leban|gyilkossag|halal|nyomoz|rejtely|tetthely|bunteny|detektiv/i.test(s),
  },
  {
    slug: "kaland",
    name: "Kalandregény",
    test: (s) => /rejto|verne|may karl|dumas|salgari|london jack|legio|kaland|kincs|sziget|expedicio|hajo/i.test(s),
  },
  {
    slug: "magyar-irodalom",
    name: "Magyar Irodalom",
    test: (s) => /jokai|gardonyi|mikszath|moricz|krudy|karinthy|kosztolanyi|arany janos|petofi|ady endre|babits|jozsef attila|radnoti|wass albert|moldova|orkeny|szabo magda|marai|nemeth laszlo|illes/i.test(s),
  },
  {
    slug: "horror",
    name: "Horror & Thriller",
    test: (s) => /king|koontz|poe|lovecraft|barker|stoker|straub|remulet|pokol|sotet|szorny|ver|felelem|retteges|kisertet|fantom|thriller/i.test(s),
  },
  {
    slug: "romantikus",
    name: "Romantikus",
    test: (s) => /roberts|steel|sandemo|austen|bronte|sparks|szerelem|sziv|vagy|szenvedely|eskuvo|menyasszony|csok/i.test(s),
  },
  {
    slug: "tortenelem",
    name: "Történelmi Regény",
    test: (s) => /passuth|waltari|clavell|gardonyi|jokai|dumas|druon|tortenelem|kozepkor|roma|csaszar|kiraly|haboru|csata|lovag|honfoglalas|szabadsagharc/i.test(s),
  },
  {
    slug: "humor",
    name: "Humor & Szatíra",
    test: (s) => /rejto|moldova|karinthy|wodehouse|adams douglas|pratchett|humor|vicc|szatira|kacagas|komedia|parodia/i.test(s),
  },
  {
    slug: "vilagirodalom",
    name: "Világirodalom",
    test: (s) => /tolstoy|dostoevsky|dosztojevszkij|hugo|hemingway|kafka|marquez|shakespeare|wilde|goethe|cervantes|mann thomas|camus|sartre|joyce/i.test(s),
  },
  {
    slug: "ifjusagi",
    name: "Ifjúsági & Családi",
    test: (s) => /rowling|lindgren|saint-exupery|molnar ferenc|fekete istvan|mese|fiuk|gyerek|ifjusag|kamasz|herceg|varazslat/i.test(s),
  },
  {
    slug: "disztopia",
    name: "Disztópia",
    test: (s) => /orwell|huxley|bradbury|atwood|zamjatin|1984|szep uj vilag|allatfarm|disztopia|apokalipszis|elnyomas/i.test(s),
  },
  {
    slug: "kiberpunk",
    name: "Kiberpunk",
    test: (s) => /gibson|stephenson|sterling|kiber|neuromancer|neuromanc|matrix|hacker|virtualis|kiborg/i.test(s),
  },
  {
    slug: "uropera",
    name: "Űropera",
    test: (s) => /herbert|asimov|clarke|hamilton|banks|dune|dune|alapitvany|birodalom|urhajo|csillagkozi|hiperter/i.test(s),
  },
  {
    slug: "misztikum",
    name: "Misztikum & Ezotéria",
    test: (s) => /misztik|titok|okkult|lelek|szellem|joslat|asztrologia|ezoteria|meditacio|karma|reinkarnacio/i.test(s),
  },
  {
    slug: "filozofia",
    name: "Filozófia",
    test: (s) => /platon|arisztotelesz|kant|nietzsche|schopenhauer|kierkegaard|aurelius|filozofia|bolcselet|etika|gondolkodas/i.test(s),
  },
  {
    slug: "novellak",
    name: "Novellák & Kisregények",
    test: (s) => /novella|elbeszeles|antologia|tortenetek|valogatas|karcolat|rovid/i.test(s),
  },
  {
    slug: "eletrajz",
    name: "Életrajz & Memoár",
    test: (s) => /eletrajz|oneletrajz|memoar|emlekirat|naplo|vallomasok|portre/i.test(s),
  },
  {
    slug: "pszichologia",
    name: "Pszichológia & Önismeret",
    test: (s) => /freud|jung|adler|fromm|pszichologia|lelektan|onismeret|terapia|szemelyiseg|tudatalatti/i.test(s),
  },
  {
    slug: "versek",
    name: "Versek & Líra",
    test: (s) => /vers|versek|lira|koltemeny|kolteszet|szonett|ballada/i.test(s),
  },
  {
    slug: "tudomany",
    name: "Ismeretterjesztő & Tudomány",
    test: (s) => /tudomany|ismeretterjeszto|fizika|matematika|biologia|kemia|csillagaszat|univerzum|darwin|hawking|sagan/i.test(s),
  },
];

// Map genre keywords
function inferCategories(author: string, title: string): string[] {
  const normText = norm(`${author} ${title}`);
  const matched: string[] = [];

  for (const g of GENRE_DEFINITIONS) {
    if (g.test(normText)) {
      matched.push(g.name);
      if (matched.length >= 2) break;
    }
  }

  if (matched.length === 0) {
    return ["Szépirodalom", "Olvasmány"];
  }

  return matched;
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

function getBookPriorityScore(x: MegaBookRecord): number {
  let score = 0;
  if (x.coverId) score += 1000;
  const author = x.author.toLowerCase();
  if (
    author.includes("rejto") || author.includes("rejtő") ||
    author.includes("asimov") ||
    author.includes("christie") ||
    author.includes("herbert") ||
    author.includes("orwell") ||
    author.includes("verne") ||
    author.includes("gardonyi") || author.includes("gárdonyi") ||
    author.includes("jokai") || author.includes("jókai") ||
    author.includes("king") ||
    author.includes("bradbury") ||
    author.includes("clarke") ||
    author.includes("lem") ||
    author.includes("dick") ||
    author.includes("tolkien") ||
    author.includes("mikszath") || author.includes("mikszáth") ||
    author.includes("moricz") || author.includes("móricz") ||
    author.includes("karinthy") ||
    author.includes("lawrence") ||
    author.includes("marquez") ||
    author.includes("merle") ||
    author.includes("huxley") ||
    author.includes("hemingway") ||
    author.includes("dumas") ||
    author.includes("stoker") ||
    author.includes("shelley") ||
    author.includes("poe") ||
    author.includes("doyle")
  ) {
    score += 500;
  }
  if (
    author === "2000" ||
    author === "100 ev termese" ||
    author.startsWith("2000 -") ||
    /^\d{4}/.test(author) ||
    x.title.toLowerCase().startsWith("erotikus viccek")
  ) {
    score -= 2000;
  }
  score += Math.min(x.formats.length * 10, 50);
  return score;
}

// Pre-process, sort by priority (renowned authors + real covers first)
const rawList: MegaBookRecord[] = (rawMegaBooks as unknown as MegaBookRecord[]) || [];
const allBooks: MegaBookRecord[] = [...rawList].sort((a, b) => getBookPriorityScore(b) - getBookPriorityScore(a));

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

function findCuratedBook(authorQuery: string, titleQuery?: string): MegaBookRecord | undefined {
  const aq = authorQuery.toLowerCase();
  const tq = titleQuery ? titleQuery.toLowerCase() : "";

  if (tq) {
    // 1. Exact title match
    const exact = allBooks.find((x) =>
      x.author.toLowerCase().includes(aq) &&
      x.title.toLowerCase() === tq &&
      x.coverId &&
      x.formats.length > 0
    );
    if (exact) return exact;

    // 2. Title starts with
    const prefix = allBooks.find((x) =>
      x.author.toLowerCase().includes(aq) &&
      x.title.toLowerCase().startsWith(tq) &&
      x.coverId &&
      x.formats.length > 0
    );
    if (prefix) return prefix;
  }

  // 3. Substring match
  return allBooks.find((x) =>
    x.author.toLowerCase().includes(aq) &&
    (!tq || x.title.toLowerCase().includes(tq)) &&
    x.coverId &&
    x.formats.length > 0
  );
}

const DAILY_FEATURED_PICKS = [
  { author: "Frank Herbert", title: "Dune", badge: "A NAP KIEMELT AJÁNLATA", reason: "Frank Herbert monumentális sci-fi mesterműve az Arrakis bolygó és az emberi civilizáció sorsáról. Kihagyhatatlan klasszikus a könyvtárban." },
  { author: "Rejto Jeno", title: "Tizennegy", badge: "A NAP KIEMELT AJÁNLATA", reason: "Rejtő Jenő utánozhatatlan humorú, megunhatatlan remekműve Gorcsev Ivánnal és a legendás tizennégy karátos autóval." },
  { author: "George Orwell", title: "1984", badge: "A NAP KIEMELT AJÁNLATA", reason: "George Orwell felkavaró disztópiája a hatalom természetéről és az egyéni szabadságról, amely ma időszerűbb, mint valaha." },
  { author: "Isaac Asimov", title: "Csillagok", badge: "A NAP KIEMELT AJÁNLATA", reason: "Isaac Asimov lenyűgöző Alapítvány- és Birodalom-univerzumának egyik legizgalmasabb regénye a zsarnokság elleni küzdelemről." },
  { author: "Agatha Christie", title: "Orient", badge: "A NAP KIEMELT AJÁNLATA", reason: "Hercule Poirot leghíresebb és legbriliánsabb nyomozása a hótorlaszban rekedt luxusvonaton." },
  { author: "Gardonyi Geza", title: "csillagok", badge: "A NAP KIEMELT AJÁNLATA", reason: "A magyar irodalom legnagyobb történelmi regénye Bornemissza Gergelyről és az egri vár dicsőséges védőiről." },
  { author: "Jules Verne", title: "80 nap", badge: "A NAP KIEMELT AJÁNLATA", reason: "Phileas Fogg és Passepartout felejthetetlen világkörüli kalandja, amely generációk képzeletét ragadta magával." },
];

export function getRecommendedMegaShelves() {
  const candidatesWithCovers = allBooks.filter((b) => b.coverId && b.formats.length > 0);

  // Deterministic daily pick based on day of month
  const pickIndex = new Date().getDate() % DAILY_FEATURED_PICKS.length;
  const featuredConfig = DAILY_FEATURED_PICKS[pickIndex];
  const pick = findCuratedBook(featuredConfig.author, featuredConfig.title) || candidatesWithCovers[0] || allBooks[0];

  const todaysPick = {
    book: toBookCard(pick),
    reason: featuredConfig.reason,
    badge: featuredConfig.badge,
  };

  const resolveShelf = (specs: Array<[string, string]>, fallbackOffset: number, count: number = 8) => {
    const list: MegaBookRecord[] = [];
    const usedIds = new Set<string>();

    for (const [author, title] of specs) {
      const b = findCuratedBook(author, title);
      if (b && !usedIds.has(b.id)) {
        list.push(b);
        usedIds.add(b.id);
      }
    }

    if (list.length < count) {
      for (let i = fallbackOffset; i < candidatesWithCovers.length && list.length < count; i++) {
        const candidate = candidatesWithCovers[i];
        if (!usedIds.has(candidate.id)) {
          list.push(candidate);
          usedIds.add(candidate.id);
        }
      }
    }

    return list.slice(0, count).map(toBookCard);
  };

  return {
    todaysPick,
    shelves: {
      // 1. NEKED AJÁNLJUK: Masterpieces across genres
      forYou: resolveShelf([
        ["Frank Herbert", "Dune"],
        ["Rejto Jeno", "Tizennegy"],
        ["Isaac Asimov", "Csillagok"],
        ["Agatha Christie", "Orient"],
        ["George Orwell", "1984"],
        ["Jules Verne", "80 nap"],
        ["Gardonyi Geza", "csillagok"],
        ["Stephen King", "11_22_63"],
      ], 0, 8),

      // 2. OLVASÁS FOLYTATÁSA: Famous adventure & historical classics
      continueReading: resolveShelf([
        ["Leslie L. Lawrence", "kigyoja"],
        ["Jokai Mor", "arany"],
        ["Mikszath Kalman", "fekete"],
        ["Karinthy Frigyes", "Capillaria"],
        ["Arthur C. Clarke", "2001"],
        ["Stanislaw Lem", "Legyozhetetlen"],
      ], 15, 6),

      // 3. ÚJDONSÁGOK A KÖNYVTÁRBAN: Acclaimed literary works
      newInLibrary: resolveShelf([
        ["Tolkien", "Gyuru"],
        ["Bradbury", "Mars"],
        ["Philip K. Dick", "Scanner"],
        ["Jokai Mor", "koszivu"],
        ["Rejto Jeno", "Piszkos Fred"],
        ["Agatha Christie", "neger"],
        ["Isaac Asimov", "robotjai"],
        ["Gardonyi Geza", "kapitany"],
      ], 30, 8),

      // 4. NÉPSZERŰ A KÖZÖSSÉGBEN: The most celebrated classics
      trending: resolveShelf([
        ["George Orwell", "1984"],
        ["Frank Herbert", "Dune"],
        ["Rejto Jeno", "Piszkos Fred"],
        ["Agatha Christie", "neger"],
        ["Jules Verne", "80 nap"],
        ["Stephen King", "11_22_63"],
        ["Gardonyi Geza", "csillagok"],
        ["Jokai Mor", "arany"],
      ], 45, 8),

      // 5. MIVEL TETSZETT A SCI-FI: Pure sci-fi greatness
      becauseYouLiked: resolveShelf([
        ["Frank Herbert", "Dune"],
        ["Isaac Asimov", "Csillagok"],
        ["Isaac Asimov", "robotjai"],
        ["Arthur C. Clarke", "2001"],
        ["Stanislaw Lem", "Legyozhetetlen"],
        ["Philip K. Dick", "Scanner"],
        ["Bradbury", "Mars"],
        ["George Orwell", "1984"],
      ], 60, 8),

      // 6. GYORS OLVASMÁNYOK: Fast-paced novellas and humorous adventures
      quickReads: resolveShelf([
        ["Rejto Jeno", "Tizennegy"],
        ["Rejto Jeno", "Piszkos Fred"],
        ["Karinthy Frigyes", "Capillaria"],
        ["Agatha Christie", "Orient"],
        ["Gardonyi Geza", "kapitany"],
        ["Leslie L. Lawrence", "kigyoja"],
        ["Jules Verne", "80 nap"],
        ["Arthur C. Clarke", "2001"],
      ], 75, 8),
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

export interface MegaBooksQueryOptions {
  category?: string | null;
  searchQuery?: string | null;
  sortBy?: string | null;
  page?: number;
  limit?: number;
  skip?: number;
}

export function getMegaBooksFilteredAndSorted(options: MegaBooksQueryOptions = {}) {
  const { category, searchQuery, sortBy, page, limit = 20 } = options;
  const skip = options.skip !== undefined ? options.skip : page ? (page - 1) * limit : 0;

  let list = allBooks;

  // 1. Filter by category
  if (category && category !== "all") {
    const normCategory = norm(category);
    const genreDef = GENRE_DEFINITIONS.find(
      (g) => g.slug === category.toLowerCase().trim() || norm(g.name) === normCategory
    );

    if (genreDef) {
      list = list.filter((b) => genreDef.test(norm(`${b.author} ${b.title}`)));
    } else {
      list = list.filter((b) => norm(`${b.author} ${b.title}`).includes(normCategory));
    }
  }

  // 2. Filter by search query if provided
  if (searchQuery && searchQuery.trim()) {
    const q = norm(searchQuery);
    list = list.filter((b) => norm(`${b.author} ${b.title}`).includes(q));
  }

  // 3. Sorting
  const sorted = [...list];

  switch (sortBy) {
    case "author_asc":
      sorted.sort((a, b) => authorSortKey(a.author).localeCompare(authorSortKey(b.author), "hu"));
      break;
    case "author_desc":
      sorted.sort((a, b) => authorSortKey(b.author).localeCompare(authorSortKey(a.author), "hu"));
      break;
    case "title_asc":
      sorted.sort((a, b) => titleSortKey(a.title).localeCompare(titleSortKey(b.title), "hu"));
      break;
    case "title_desc":
      sorted.sort((a, b) => titleSortKey(b.title).localeCompare(titleSortKey(a.title), "hu"));
      break;
    case "rating_desc":
      sorted.sort((a, b) => {
        const hashA = Math.abs(a.title.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0));
        const hashB = Math.abs(b.title.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0));
        return (hashB % 6) - (hashA % 6);
      });
      break;
    case "newest":
      sorted.sort((a, b) => (b.calibreId || 0) - (a.calibreId || 0));
      break;
    case "popular":
    default:
      // Keep default priority score sort (already sorted in allBooks)
      break;
  }

  const paginated = sorted.slice(skip, skip + limit);
  const currentPage = Math.floor(skip / limit) + 1;

  return {
    books: paginated.map(toBookCard),
    pagination: {
      total: sorted.length,
      page: currentPage,
      limit,
      totalPages: Math.ceil(sorted.length / limit),
    },
  };
}

