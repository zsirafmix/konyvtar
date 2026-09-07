export interface BookItem {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  authors: { name: string }[];
  categories: { name: string }[];
  tags: { name: string }[];
  averageRating: number;
  ratingsCount: number;
  coverUrl?: string | null;
  publishedYear?: number | null;
  pages?: number | null;
  vector?: number[];
  seriesName?: string | null;
  seriesPosition?: number | null;
  distributionStatus?: string;
  libraryReleaseAt?: Date | string;
}

export interface UserHistoryItem {
  bookId: string;
  rating?: number | null;
  status: "WANT_TO_READ" | "READING" | "COMPLETED" | "PAUSED" | "ABANDONED";
  isFavorite?: boolean;
}

export interface RecommendationResult {
  bookId: string;
  book: BookItem;
  score: number;
  reason: string;
  algorithmSource: "content_based" | "collaborative" | "semantic" | "series" | "serendipity";
}

export interface TasteSimilarityResult {
  similarityScore: number; // 0 to 100
  commonBooksCount: number;
  sharedFavoritesCount: number;
  summary: string;
}

export interface TodayPickResult {
  book: BookItem;
  reason: string;
  badge: string;
}

/**
 * Calculates taste similarity between two users based on their reading history and ratings.
 */
export function calculateTasteSimilarity(
  userAHistory: UserHistoryItem[],
  userBHistory: UserHistoryItem[]
): TasteSimilarityResult {
  const mapA = new Map(userAHistory.map((h) => [h.bookId, h]));
  const mapB = new Map(userBHistory.map((h) => [h.bookId, h]));

  let commonCount = 0;
  let sharedFavorites = 0;
  let ratingDiffSum = 0;
  let ratedCommonCount = 0;

  for (const [bookId, itemA] of mapA.entries()) {
    const itemB = mapB.get(bookId);
    if (itemB) {
      commonCount++;
      if (itemA.isFavorite && itemB.isFavorite) {
        sharedFavorites++;
      }
      if (itemA.rating && itemB.rating) {
        ratingDiffSum += Math.abs(itemA.rating - itemB.rating);
        ratedCommonCount++;
      }
    }
  }

  if (commonCount === 0) {
    return {
      similarityScore: 45,
      commonBooksCount: 0,
      sharedFavoritesCount: 0,
      summary: "Még nincsenek közös könyveitek, de ízlésetek a kedvenc műfajok alapján összefonódhat.",
    };
  }

  // Base score on overlap ratio and rating closeness
  const minSize = Math.min(mapA.size, mapB.size);
  const overlapRatio = minSize > 0 ? Math.min(1.0, commonCount / minSize) : 0;
  const ratingCloseness = ratedCommonCount > 0 ? Math.max(0, 1.0 - ratingDiffSum / (ratedCommonCount * 4)) : 0.8;

  const score = Math.min(100, Math.max(20, Math.round((overlapRatio * 0.6 + ratingCloseness * 0.4) * 100)));

  return {
    similarityScore: score,
    commonBooksCount: commonCount,
    sharedFavoritesCount: sharedFavorites,
    summary: `Ízlés-egyezés: ${score}% (${commonCount} közös olvasmány, ${sharedFavorites} közös kedvenc)`,
  };
}

/**
 * 70-20-10 Hybrid Recommendation Engine.
 * 70% Known preferences (same authors, categories, highly rated)
 * 20% Near new topics (semantic/topic adjacent)
 * 10% Discovery / Serendipity (unexpected high quality gem)
 */
export function generateRecommendations(
  allBooks: BookItem[],
  userHistory: UserHistoryItem[],
  limit = 10,
  config = { preferenceRatio: 0.7, adjacentRatio: 0.2, serendipityRatio: 0.1 }
): RecommendationResult[] {
  const readBookIds = new Set(
    userHistory.filter((h) => h.status === "COMPLETED" || h.status === "READING").map((h) => h.bookId)
  );

  // Available books the user hasn't completed
  const candidateBooks = allBooks.filter((b) => !readBookIds.has(b.id));
  if (candidateBooks.length === 0) return [];

  // Extract user preference profiles
  const likedCategories = new Map<string, number>();
  const likedAuthors = new Map<string, number>();

  for (const item of userHistory) {
    const book = allBooks.find((b) => b.id === item.bookId);
    if (!book) continue;

    const weight = (item.rating || 3.5) + (item.isFavorite ? 2 : 0);
    for (const cat of book.categories) {
      likedCategories.set(cat.name, (likedCategories.get(cat.name) || 0) + weight);
    }
    for (const author of book.authors) {
      likedAuthors.set(author.name, (likedAuthors.get(author.name) || 0) + weight);
    }
  }

  const preferenceCount = Math.round(limit * config.preferenceRatio);
  const adjacentCount = Math.round(limit * config.adjacentRatio);
  const serendipityCount = Math.max(1, limit - preferenceCount - adjacentCount);

  const results: RecommendationResult[] = [];
  const usedBookIds = new Set<string>();

  // 1. 70% PREFERENCES
  const scoredPreferenceBooks = candidateBooks
    .map((b) => {
      let score = b.averageRating * 1.5;
      let reason = "Ajánlott olvasmány az ízlésed alapján.";
      let matchedAuthor = "";
      let matchedCategory = "";

      for (const a of b.authors) {
        if (likedAuthors.has(a.name)) {
          score += (likedAuthors.get(a.name) || 0) * 2.0;
          matchedAuthor = a.name;
        }
      }

      for (const c of b.categories) {
        if (likedCategories.has(c.name)) {
          score += (likedCategories.get(c.name) || 0) * 1.5;
          matchedCategory = c.name;
        }
      }

      if (matchedAuthor) {
        reason = `Mivel kedveled ${matchedAuthor} műveit, ez a könyv azonnal magával ragad majd.`;
      } else if (matchedCategory) {
        reason = `A népszerű ${matchedCategory} műfajú olvasmányaid alapján kifejezetten neked szól.`;
      } else {
        reason = `Kiváló értékelésű mű a közösségünk ajánlásával (${b.averageRating.toFixed(1)} ★).`;
      }

      return { book: b, score, reason, algorithmSource: "content_based" as const };
    })
    .sort((a, b) => b.score - a.score);

  for (const item of scoredPreferenceBooks) {
    if (results.length >= preferenceCount) break;
    results.push({
      bookId: item.book.id,
      book: item.book,
      score: parseFloat(item.score.toFixed(2)),
      reason: item.reason,
      algorithmSource: item.algorithmSource,
    });
    usedBookIds.add(item.book.id);
  }

  // 2. 20% ADJACENT / SEMANTIC
  const remainingForAdjacent = candidateBooks.filter((b) => !usedBookIds.has(b.id));
  const adjacentBooks = remainingForAdjacent
    .map((b) => {
      const score = b.averageRating * 2.0 + (b.ratingsCount > 10 ? 5 : 0);
      const firstCat = b.categories[0]?.name || "Irodalom";
      const reason = `Közeli új téma: izgalmas kitekintés a(z) ${firstCat} világába a megszokott kedvenceid mellett.`;
      return { book: b, score, reason, algorithmSource: "semantic" as const };
    })
    .sort((a, b) => b.score - a.score);

  for (const item of adjacentBooks) {
    if (results.length >= preferenceCount + adjacentCount) break;
    results.push({
      bookId: item.book.id,
      book: item.book,
      score: parseFloat(item.score.toFixed(2)),
      reason: item.reason,
      algorithmSource: item.algorithmSource,
    });
    usedBookIds.add(item.book.id);
  }

  // 3. 10% SERENDIPITY / DISCOVERY
  const remainingForDiscovery = candidateBooks.filter((b) => !usedBookIds.has(b.id));
  if (remainingForDiscovery.length > 0) {
    // Pick high rating or unique books
    const shuffled = [...remainingForDiscovery].sort(() => 0.5 - Math.random());
    for (const b of shuffled) {
      if (results.length >= limit) break;
      results.push({
        bookId: b.id,
        book: b,
        score: parseFloat((b.averageRating * 1.2).toFixed(2)),
        reason: `Véletlen felfedezés: egy kiemelkedő gyöngyszem, amely új perspektívát nyithat az olvasási élményeidben.`,
        algorithmSource: "serendipity",
      });
      usedBookIds.add(b.id);
    }
  }

  return results;
}

/**
 * Generates Today's Pick for the hero banner.
 */
export function generateTodaysPick(allBooks: BookItem[], userHistory: UserHistoryItem[] = []): TodayPickResult {
  const recommendations = generateRecommendations(allBooks, userHistory, 1);
  if (recommendations.length > 0) {
    const pick = recommendations[0];
    return {
      book: pick.book,
      reason: pick.reason,
      badge: "A Nap Kiemelt Ajánlata",
    };
  }

  // Fallback to highest rated book
  const fallback = [...allBooks].sort((a, b) => b.averageRating - a.averageRating)[0] || allBooks[0];
  return {
    book: fallback,
    reason: "A digitális könyvtár egyik legmagasabbra értékelt remekműve, amit minden olvasónak érdemes felfedeznie.",
    badge: "A Nap Kiemelt Ajánlata",
  };
}
