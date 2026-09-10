import { ALL_103_GENRES, matchGenreForText, normStr } from "./genres-data";

export function detectGenre(textToScan: string): string {
  return matchGenreForText(textToScan);
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

/**
 * Moly.hu metadata & cover scraper
 */
export async function fetchMolyMetadata(searchTitle: string, searchAuthor?: string): Promise<{
  title?: string;
  author?: string;
  description?: string;
  coverUrl?: string;
  genre?: string;
  rating?: number;
  publishedYear?: number;
} | null> {
  try {
    const query = [searchAuthor, searchTitle].filter(Boolean).join(" ").trim();
    if (!query) return null;

    const searchUrl = `https://moly.hu/kereses?query=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "hu-HU,hu;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();

    // Look for book links like href="/konyvek/author-title-slug"
    const bookLinks = Array.from(html.matchAll(/href="(\/konyvek\/[a-zA-Z0-9_\-]+)"/g))
      .map((m) => m[1])
      .filter((link) => !link.includes("/uj") && !link.includes("/friss") && !link.includes("/top") && !link.includes("/details"));

    if (bookLinks.length === 0) return null;
    const bookPath = bookLinks[0];

    // Fetch book page
    const bookUrl = `https://moly.hu${bookPath}`;
    const bCtrl = new AbortController();
    const bTimeout = setTimeout(() => bCtrl.abort(), 4500);

    const bRes = await fetch(bookUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "hu-HU,hu;q=0.9",
      },
      signal: bCtrl.signal,
    });
    clearTimeout(bTimeout);

    if (!bRes.ok) return null;
    const bHtml = await bRes.text();

    let coverUrl = "";
    const coverMatch = bHtml.match(/https:\/\/assets\.moly\.hu\/system\/covers\/(?:big|normal)\/covers_[0-9]+\.(?:jpg|png|jpeg)(?:\?[0-9]+)?/i);
    if (coverMatch) {
      coverUrl = coverMatch[0].replace("/normal/", "/big/");
    }

    let foundTitle = "";
    let foundAuthor = "";
    const titleTagMatch = bHtml.match(/<title>([^<]+)<\/title>/i);
    if (titleTagMatch) {
      const parts = titleTagMatch[1].replace(/· Könyv · Moly/i, "").split(":");
      if (parts.length >= 2) {
        foundAuthor = parts[0].trim();
        foundTitle = parts.slice(1).join(":").trim();
      }
    }

    let rating: number | undefined;
    const ratingMatch = bHtml.match(/class="like_count"[^>]*>([0-9]+)%/);
    if (ratingMatch) {
      const pct = parseInt(ratingMatch[1], 10);
      if (!isNaN(pct)) rating = parseFloat((pct / 20).toFixed(1));
    }

    let description = "";
    try {
      const fulszovegUrl = `https://moly.hu${bookPath}/fulszovegek`;
      const fCtrl = new AbortController();
      const fTimeout = setTimeout(() => fCtrl.abort(), 3500);

      const fRes = await fetch(fulszovegUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "hu-HU,hu;q=0.9",
        },
        signal: fCtrl.signal,
      });
      clearTimeout(fTimeout);

      if (fRes.ok) {
        const fHtml = await fRes.text();
        const atomMatch = fHtml.match(/<div class="atom">\s*<p>([\s\S]*?)<\/p>\s*<\/div>/i);
        if (atomMatch && atomMatch[1]) {
          description = atomMatch[1]
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]+>/g, "")
            .trim();
        }
      }
    } catch {
      // Ignored
    }

    if (!description) {
      const atomMatch = bHtml.match(/<div class="atom">\s*<p>([\s\S]*?)<\/p>\s*<\/div>/i);
      if (atomMatch && atomMatch[1]) {
        description = atomMatch[1]
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]+>/g, "")
          .trim();
      }
    }

    const genre = matchGenreForText(`${foundTitle || searchTitle} ${foundAuthor || searchAuthor} ${description}`);

    return {
      title: foundTitle || undefined,
      author: foundAuthor || undefined,
      description: description || undefined,
      coverUrl: coverUrl || undefined,
      genre,
      rating,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Multi-tier metadata and cover lookup
 * Priority:
 * 1. Moly.hu (premier Hungarian book database)
 * 2. Hungarian Wikipedia REST API & MEK OSZK
 * 3. Google Books HU (Hungarian language restriction)
 * 4. Fallback foreign databases (Google Books Intl, OpenLibrary)
 * 5. Calibre Catalog heuristic
 */
export async function fetchMetadataForBook(searchTitle: string, searchAuthor?: string) {
  let title = searchTitle;
  let author = searchAuthor || "";
  let genre = "regény";
  let publishedYear: number | undefined;
  let description = "";
  let coverUrl = "";
  let source = "heurisztika";

  // 1. MOLY.HU (Premier Hungarian Book Database)
  try {
    const moly = await fetchMolyMetadata(searchTitle, searchAuthor);
    if (moly) {
      if (moly.title) title = moly.title;
      if (moly.author && (!author || author === "Ismeretlen szerző")) author = moly.author;
      if (moly.coverUrl) coverUrl = moly.coverUrl;
      if (moly.description) description = moly.description;
      if (moly.genre) genre = moly.genre;
      if (moly.publishedYear) publishedYear = moly.publishedYear;
      source = "Moly.hu";
    }
  } catch (molyErr) {
    console.warn("Moly.hu lookup skipped/failed:", molyErr);
  }

  // 2. Magyar Wikipédia REST API (if description or cover still needed)
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
            if (genre === "regény" || !genre) {
              genre = matchGenreForText(wData.extract);
            }
            if (source === "heurisztika") source = "Magyar Wikipédia";
            break;
          }
        }
      }
    } catch {
      // Graceful fallback
    }
  }

  // 3. Google Books HU API
  if (!coverUrl || !description) {
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
          if (!title || title === searchTitle) title = best.title || title;
          if ((!author || author === "Ismeretlen szerző") && best.authors?.length > 0) {
            author = best.authors.join(", ");
          }
          if (!publishedYear && best.publishedDate) {
            const y = parseInt(best.publishedDate.substring(0, 4), 10);
            if (!isNaN(y)) publishedYear = y;
          }
          if (!description && best.description) {
            description = best.description;
          }
          if (!coverUrl && best.imageLinks) {
            const imgLinks = best.imageLinks;
            const rawCover = imgLinks.thumbnail || imgLinks.smallThumbnail || imgLinks.medium || imgLinks.large;
            const upgraded = upgradeGoogleCoverUrl(rawCover);
            if (upgraded) coverUrl = upgraded;
          }

          if (genre === "regény" || !genre) {
            const categories = (best.categories || []).join(" ");
            genre = matchGenreForText(`${title} ${categories} ${description}`);
          }
          if (source === "heurisztika") source = "Google Books HU";
        }
      }
    } catch {
      // Google Books HU timeout/skip
    }
  }

  // 4. Foreign Fallback: Google Books International & Open Library
  if (!coverUrl || !description) {
    try {
      const olParams = new URLSearchParams();
      olParams.append("title", searchTitle);
      if (searchAuthor) olParams.append("author", searchAuthor);
      olParams.append("limit", "5");

      const olUrl = `https://openlibrary.org/search.json?${olParams.toString()}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

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
          if ((genre === "regény" || !genre) && doc.subject) {
            genre = matchGenreForText(doc.subject.join(" "));
          }
        }
      }
    } catch {
      // Open Library fallback skip
    }
  }

  // 5. Library Catalog Match Fallback (11,472 Calibre MEGA books)
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
        if ((genre === "regény" || !genre) && top.genre) {
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
    genre: genre || "regény",
    publishedYear: publishedYear || new Date().getFullYear(),
    description,
    coverUrl,
    source,
  };
}
