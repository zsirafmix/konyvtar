import { BookItem } from "./recommender";
import { generateDeterministicEmbedding, cosineSimilarity } from "./embeddings";

export interface AskLibraryResponse {
  answer: string;
  matchedBooks: BookItem[];
  confidence: number;
  sourcesUsedCount: number;
}

const STOP_WORDS = new Set([
  "van", "volt", "lesz", "adj", "egy", "melyik", "ez", "az", "hogy", "nem", "meg",
  "kell", "lehet", "amivel", "amely", "akik", "sok", "kevés", "és", "vagy", "való",
  "könyv", "könyvek", "könyvem", "könyveim", "könyvet", "könyveket", "számára", "során",
  "milyen", "olvassam", "elkezdhetem", "beszélnek"
]);

function stemHu(word: string): string {
  return word
    .toLowerCase()
    .replace(/(ról|ről|ban|ben|ból|ből|nak|nek|hoz|hez|höz|val|vel|át|ét|at|et|ot|öt|t|i|k)$/i, "");
}

function matchWord(target: string | null | undefined, word: string): boolean {
  if (!target) return false;
  const lower = target.toLowerCase();
  const stem = stemHu(word);
  return lower.includes(word) || (stem.length >= 3 && lower.includes(stem));
}

/**
 * Grounds the query strictly on the user's accessible library items.
 * Uses hybrid semantic + keyword scoring to find relevant books and synthesizes
 * an informative Hungarian answer with exact book references.
 */
export async function queryAskMyLibrary(
  query: string,
  userAccessibleBooks: BookItem[]
): Promise<AskLibraryResponse> {
  const normalizedQuery = query.toLowerCase().trim();
  const queryVector = generateDeterministicEmbedding(normalizedQuery);
  const queryWords = normalizedQuery
    .replace(/[^a-záéíóöőúüű\s]/g, "")
    .split(/\s+/)
    .filter((w) => !STOP_WORDS.has(w) && w.length > 2);

  // Score candidate books based on semantic cosine similarity + keyword hits
  const scoredBooks = userAccessibleBooks.map((book) => {
    // 1. Vector similarity
    const bookText = `${book.title} ${book.description || ""} ${book.authors.map((a) => a.name).join(" ")} ${book.categories.map((c) => c.name).join(" ")} ${book.tags.map((t) => t.name).join(" ")}`;
    const bookVector = book.vector || generateDeterministicEmbedding(bookText);
    const sim = cosineSimilarity(queryVector, bookVector);

    // 2. Weighted Keyword hits
    let keywordScore = 0;
    for (const w of queryWords) {
      if (matchWord(book.title, w)) keywordScore += 10.0;
      for (const a of book.authors) {
        if (matchWord(a.name, w)) keywordScore += 6.0;
      }
      for (const c of book.categories) {
        if (matchWord(c.name, w)) keywordScore += 5.0;
      }
      for (const t of book.tags) {
        if (matchWord(t.name, w)) keywordScore += 4.0;
      }
      if (matchWord(book.description, w)) keywordScore += 2.0;
    }

    // Normalize cosine similarity to [0, 1]
    const normalizedSim = Math.max(0, (sim + 1) / 2);
    const totalScore = keywordScore > 0
      ? keywordScore * 0.8 + normalizedSim * 0.2
      : normalizedSim * 0.2;

    return { book, score: totalScore, sim, keywordScore };
  });

  scoredBooks.sort((a, b) => b.score - a.score);

  // Filter relevant books
  const topMatches = scoredBooks.filter((item) => item.score > 0.25).slice(0, 5);

  if (topMatches.length === 0) {
    return {
      answer: `A könyvtáradban jelenleg nem találtam kifejezetten a(z) „${query}” kérdéshez közvetlenül kapcsolódó könyvet. Próbálj általánosabb témára keresni, vagy tölts fel új könyveket a gyűjteményedbe!`,
      matchedBooks: [],
      confidence: 0.2,
      sourcesUsedCount: 0,
    };
  }

  // Synthesize Hungarian response
  const matchedBooks = topMatches.map((m) => m.book);
  const bookListBullets = matchedBooks
    .map(
      (b, idx) =>
        `${idx + 1}. **${b.title}** (${b.authors.map((a) => a.name).join(", ")}${b.publishedYear ? `, ${b.publishedYear}` : ""}) – ${b.categories[0]?.name || "Kiemelt mű"}, értékelés: ${b.averageRating.toFixed(1)} ★`
    )
    .join("\n");

  let summaryText = "";

  const isOrderQuery = normalizedQuery.includes("sorrend") || normalizedQuery.includes("kronológia");
  const isAuthorQuery = normalizedQuery.includes("kicsoda") || normalizedQuery.includes("ki az a") || normalizedQuery.includes("életrajz");
  const isPlotQuery = normalizedQuery.includes("miről szól") || normalizedQuery.includes("cselekmény") || normalizedQuery.includes("tartalom");
  const isBeginnerQuery = normalizedQuery.includes("kezd") || normalizedQuery.includes("kezdő") || normalizedQuery.includes("alap");

  if (isOrderQuery) {
    summaryText = `### 📚 Ajánlott Olvasási Sorrend\n\nA gyűjteményedben található adatok és irodalmi konvenciók alapján az alábbi logikai és kronológiai sorrend javasolt:\n\n${bookListBullets}\n\n> **Könyvtáros tanácsa:** Mindig az alapozó kötetekkel kezdd, hogy teljes egészében megértsd a világépítést és a karakterek összefüggéseit!`;
  } else if (isAuthorQuery) {
    const authorName = matchedBooks[0]?.authors[0]?.name || "a keresett szerző";
    summaryText = `### ✍️ Szerzői Áttekintés: ${authorName}\n\nA könyvtáradban az alábbi művei érhetők el azonnali olvasásra és letöltésre:\n\n${bookListBullets}\n\nEzek a kötetek átfogó képet adnak az író stílusáról és legfontosabb témáiról.`;
  } else if (isPlotQuery) {
    const mainBook = matchedBooks[0];
    summaryText = `### 📖 Ismertető: ${mainBook.title}\n\n**Szerző:** ${mainBook.authors.map((a) => a.name).join(", ")}\n\n${mainBook.description ? mainBook.description.slice(0, 400).replace(/<[^>]+>/g, "") + "..." : "A mű a könyvtár kiemelt állományának része, teljes terjedelmében elérhető."}\n\n**Kapcsolódó könyvek a gyűjteményedben:**\n\n${bookListBullets}`;
  } else if (isBeginnerQuery) {
    summaryText = `### 🌟 Ajánlott Belépő Kötetek\n\nA témával való ismerkedéshez a legáttekinthetőbb és legmagasabbra értékelt köteteket ajánlom:\n\n${bookListBullets}\n\nEzek a könyvek biztos alapokat nyújtanak a további elmélyüléshez.`;
  } else {
    summaryText = `### 🏛️ Könyvtári Találatok\n\nA könyvtáradban ${matchedBooks.length} releváns művet találtam a(z) „${query}” kérdéskörben:\n\n${bookListBullets}\n\nA fenti kötetek mind elérhetők a gyűjteményedben és azonnal megnyithatók online olvasásra vagy letöltésre.`;
  }

  return {
    answer: summaryText,
    matchedBooks,
    confidence: topMatches[0].score > 0.5 ? 0.95 : 0.75,
    sourcesUsedCount: matchedBooks.length,
  };
}
