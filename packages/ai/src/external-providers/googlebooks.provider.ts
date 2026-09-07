import { ExternalMetadataProvider, BookMetadataResult } from "./provider.interface";

export class GoogleBooksProvider implements ExternalMetadataProvider {
  readonly name = "google_books";

  async search(query: { title: string; author?: string; isbn?: string }): Promise<BookMetadataResult[]> {
    try {
      let q = "";
      if (query.isbn) {
        q = `isbn:${query.isbn}`;
      } else {
        const parts = [];
        if (query.title) parts.push(`intitle:${query.title}`);
        if (query.author) parts.push(`inauthor:${query.author}`);
        q = parts.join("+");
      }

      if (!q) return [];

      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) return [];
      const data = await res.json();
      const items = data.items || [];

      return items.map((item: any) => {
        const vi = item.volumeInfo || {};
        const isbns = vi.industryIdentifiers || [];
        const isbn10 = isbns.find((id: any) => id.type === "ISBN_10")?.identifier;
        const isbn13 = isbns.find((id: any) => id.type === "ISBN_13")?.identifier;

        return {
          title: vi.title || query.title,
          originalTitle: vi.subtitle,
          authors: vi.authors || (query.author ? [query.author] : ["Ismeretlen szerző"]),
          publisher: vi.publisher,
          publishedYear: vi.publishedDate ? parseInt(vi.publishedDate.substring(0, 4), 10) : undefined,
          isbn10,
          isbn13,
          description: vi.description,
          coverUrl: vi.imageLinks?.thumbnail || vi.imageLinks?.smallThumbnail,
          categories: vi.categories || [],
          language: vi.language || "hu",
          source: "google_books",
          confidence: 0.88,
        };
      });
    } catch {
      return [];
    }
  }
}
