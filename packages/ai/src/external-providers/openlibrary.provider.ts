import { ExternalMetadataProvider, BookMetadataResult } from "./provider.interface";

export class OpenLibraryProvider implements ExternalMetadataProvider {
  readonly name = "openlibrary";

  async search(query: { title: string; author?: string; isbn?: string }): Promise<BookMetadataResult[]> {
    try {
      const params = new URLSearchParams();
      if (query.isbn) {
        params.append("isbn", query.isbn);
      } else {
        if (query.title) params.append("title", query.title);
        if (query.author) params.append("author", query.author);
      }
      params.append("limit", "5");

      const url = `https://openlibrary.org/search.json?${params.toString()}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) return [];
      const data = await res.json();
      const docs = data.docs || [];

      return docs.map((doc: any) => {
        const coverId = doc.cover_i;
        const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : undefined;

        return {
          title: doc.title || query.title,
          originalTitle: doc.title_suggest,
          authors: doc.author_name || (query.author ? [query.author] : ["Ismeretlen szerző"]),
          publisher: doc.publisher?.[0],
          publishedYear: doc.first_publish_year,
          isbn10: doc.isbn?.find((i: string) => i.length === 10),
          isbn13: doc.isbn?.find((i: string) => i.length === 13),
          description: doc.first_sentence?.[0] || doc.subtitle,
          coverUrl,
          categories: doc.subject?.slice(0, 5) || [],
          language: doc.language?.[0] || "hu",
          source: "openlibrary",
          confidence: 0.9,
        };
      });
    } catch {
      // Graceful fallback on network timeout/offline
      return [];
    }
  }
}
