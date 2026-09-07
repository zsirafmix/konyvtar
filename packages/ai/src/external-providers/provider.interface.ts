export interface BookMetadataResult {
  title: string;
  originalTitle?: string;
  authors: string[];
  publisher?: string;
  publishedYear?: number;
  isbn10?: string;
  isbn13?: string;
  description?: string;
  coverUrl?: string;
  categories?: string[];
  language?: string;
  source: string;
  confidence: number;
}

export interface ExternalMetadataProvider {
  readonly name: string;
  search(query: { title: string; author?: string; isbn?: string }): Promise<BookMetadataResult[]>;
}
