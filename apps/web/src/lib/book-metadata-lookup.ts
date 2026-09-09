/**
 * Standard genre classification mapping
 */
const GENRE_RULES: Array<{ genre: string; keywords: string[] }> = [
  {
    genre: "Sci-Fi",
    keywords: ["science fiction", "sci-fi", "scifi", "űrutazás", "időutazás", "galaktikus", "robot", "mesterséges intelligencia", "űrhajó", "dűne", "alapítvány", "cyberpunk", "posztapokaliptikus", "mars"],
  },
  {
    genre: "Fantasy",
    keywords: ["fantasy", "varázsló", "sárkány", "mágia", "elf", "ork", "középkori fantasy", "witcher", "vaják", "tolkien", "gyűrűk ura", "harry potter"],
  },
  {
    genre: "Krimi & Bűnügyi",
    keywords: ["mystery", "detective", "crime", "krimi", "nyomozó", "bűnügy", "gyilkosság", "rendőrség", "poirot", "sherlock", "agatha christie", "skandináv krimi"],
  },
  {
    genre: "Horror & Thriller",
    keywords: ["horror", "thriller", "suspense", "rettegés", "pszichothriller", "szörny", "kísértet", "stephen king", "lovecraft"],
  },
  {
    genre: "Történelmi Regény",
    keywords: ["history", "historical", "történelem", "történelmi", "középkor", "világháború", "római birodalom", "század", "hadsereg", "csata", "király"],
  },
  {
    genre: "Magyar Irodalom",
    keywords: ["magyar irodalom", "magyar regény", "jókai", "móricz", "mikszáth", "gárdonyi", "rejtő", "márai", "karinthy", "kosztolányi", "krasznahorkai", "esterházy"],
  },
  {
    genre: "Filozófia",
    keywords: ["philosophy", "filozófia", "etika", "bölcselet", "nietzsche", "platón", "arisztotelész", "kant", "marcus aurelius", "sztoicizmus"],
  },
  {
    genre: "Ismeretterjesztő & Tudomány",
    keywords: ["science", "tudomány", "fizika", "csillagászat", "biológia", "evolúció", "pszichológia", "gazdaság", "ismeretterjesztő", "hawking", "sagan", "harari"],
  },
  {
    genre: "Romantikus",
    keywords: ["romance", "romantikus", "szerelem", "szerelmi", "szenvedély", "jane austen", "brontë"],
  },
  {
    genre: "Humor & Szatíra",
    keywords: ["humor", "szatíra", "komédia", "paródia", "rejtő jenő", "wodehouse", "adams douglas"],
  },
  {
    genre: "Ifjúsági & Családi",
    keywords: ["young adult", "ifjúsági", "gyermek", "kamasz", "mese", "népmese", "molnár ferenc", "pál utcai"],
  },
];

export function detectGenre(textToScan: string): string {
  const lower = textToScan.toLowerCase();
  for (const rule of GENRE_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        return rule.genre;
      }
    }
  }
  return "Általános";
}

export function parseBookFilename(filename: string): {
  cleanTitle: string;
  cleanAuthor: string;
  year?: number;
} {
  let base = filename.replace(/\.(epub|pdf|mobi|azw3|azw|prc|djvu|txt|docx|fb2)$/i, "").trim();

  let year: number | undefined;
  const yearMatch = base.match(/[(\[]\s*(18\d{2}|19\d{2}|20\d{2})\s*[)\]]/);
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
    base = base.replace(yearMatch[0], " ");
  }

  base = base
    .replace(/[(\[][^)\]]*[)\]]/g, " ")
    .replace(/\b(scan|v\d+(\.\d+)?|hun|magyar|javitott|jav|ocr|final|retail|calibre|libgen)\b/gi, " ")
    .replace(/[._]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let cleanAuthor = "";
  let cleanTitle = base;

  const dashMatch = base.split(/\s*[-–—]\s*/);
  if (dashMatch.length >= 2) {
    cleanAuthor = dashMatch[0].trim();
    cleanTitle = dashMatch.slice(1).join(" - ").trim();
  }

  if (cleanAuthor.includes(",")) {
    const nameParts = cleanAuthor.split(",").map((p) => p.trim());
    if (nameParts.length === 2) {
      cleanAuthor = `${nameParts[1]} ${nameParts[0]}`.trim();
    }
  }

  return { cleanTitle, cleanAuthor, year };
}

function upgradeGoogleCoverUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let upgraded = url.replace(/^http:\/\//i, "https://");
  upgraded = upgraded.replace(/&edge=curl/gi, "");
  upgraded = upgraded.replace(/zoom=\d+/i, "zoom=1");
  return upgraded;
}

export async function fetchMetadataForBook(searchTitle: string, searchAuthor?: string) {
  let title = searchTitle;
  let author = searchAuthor || "";
  let genre = "Általános";
  let publishedYear: number | undefined;
  let description = "";
  let coverUrl = "";
  let source = "heurisztika";

  // 1. Google Books API
  try {
    const qParts: string[] = [];
    if (searchTitle) qParts.push(`intitle:${searchTitle}`);
    if (searchAuthor) qParts.push(`inauthor:${searchAuthor}`);
    const query = qParts.length > 0 ? qParts.join("+") : encodeURIComponent(searchTitle);

    const gUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&langRestrict=hu`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(gUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const gData = await res.json();
      const items = gData.items || [];
      if (items.length > 0) {
        const best = items[0].volumeInfo || {};
        title = best.title || title;
        if (best.authors && best.authors.length > 0) {
          author = best.authors.join(", ");
        }
        if (best.publishedDate) {
          const y = parseInt(best.publishedDate.substring(0, 4), 10);
          if (!isNaN(y)) publishedYear = y;
        }
        if (best.description) {
          description = best.description;
        }
        const imgLinks = best.imageLinks;
        if (imgLinks) {
          const rawCover = imgLinks.thumbnail || imgLinks.smallThumbnail || imgLinks.medium || imgLinks.large;
          const upgraded = upgradeGoogleCoverUrl(rawCover);
          if (upgraded) coverUrl = upgraded;
        }

        const categories = (best.categories || []).join(" ");
        genre = detectGenre(`${title} ${categories} ${description}`);
        source = "Google Books";
      }
    }
  } catch (err) {
    console.warn("Google Books lookup timeout/skip:", err);
  }

  // 2. Open Library API
  if (!coverUrl || !description) {
    try {
      const olParams = new URLSearchParams();
      olParams.append("title", searchTitle);
      if (searchAuthor) olParams.append("author", searchAuthor);
      olParams.append("limit", "5");

      const olUrl = `https://openlibrary.org/search.json?${olParams.toString()}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const olRes = await fetch(olUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (olRes.ok) {
        const olData = await olRes.json();
        const docs = olData.docs || [];
        for (const doc of docs) {
          if (!author && doc.author_name) {
            author = doc.author_name.join(", ");
          }
          if (!publishedYear && doc.first_publish_year) {
            publishedYear = doc.first_publish_year;
          }
          if (!coverUrl && doc.cover_i) {
            coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
            if (source === "heurisztika") source = "Open Library";
            break;
          }
          if (!description && doc.first_sentence) {
            description = Array.isArray(doc.first_sentence) ? doc.first_sentence[0] : doc.first_sentence;
          }
          if (genre === "Általános" && doc.subject) {
            genre = detectGenre(doc.subject.join(" "));
          }
        }
      }
    } catch (err) {
      // Graceful timeout fallback
    }
  }

  // 3. Hungarian Wikipedia API (direct summary or search hit)
  if (!description || !coverUrl) {
    try {
      const candidates = [searchTitle, `${searchTitle} (regény)`, `${searchTitle} (${author})`];
      for (const cand of candidates) {
        const wikiUrl = `https://hu.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cand)}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const wRes = await fetch(wikiUrl, {
          headers: { "User-Agent": "LibrarianAI/2.0 (contact: info@konyvtar.ai)" },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (wRes.ok) {
          const wData = await wRes.json();
          if (wData.extract && !wData.extract.includes("egyértelműsítő")) {
            if (!description) description = wData.extract;
            if (!coverUrl && wData.thumbnail?.source) {
              coverUrl = wData.thumbnail.source;
            }
            if (genre === "Általános") {
              genre = detectGenre(wData.extract);
            }
            if (source === "heurisztika") source = "Magyar Wikipédia";
            break;
          }
        }
      }
    } catch (err) {
      // Graceful fallback
    }
  }

  // 4. Library Catalog Match Fallback (from our 11,472 Calibre MEGA books)
  if (!coverUrl || !description) {
    try {
      const { searchMegaBooks } = await import("./mega-catalog");
      const megaHits = searchMegaBooks(searchTitle, 5);
      if (megaHits.length > 0) {
        const top = megaHits[0];
        if (!coverUrl && top.coverUrl) {
          coverUrl = top.coverUrl;
          if (source === "heurisztika") source = "Könyvtári Archívum";
        }
        if (!description && top.description) {
          description = top.description;
        }
        if (genre === "Általános" && top.genre) {
          genre = top.genre;
        }
        if (!publishedYear && top.publishedYear) {
          publishedYear = top.publishedYear;
        }
      }
    } catch {
      // Library catalog fallback skip
    }
  }

  return {
    title,
    author: author || "Ismeretlen szerző",
    genre: genre || "Általános",
    publishedYear: publishedYear || new Date().getFullYear(),
    description,
    coverUrl,
    source,
  };
}
