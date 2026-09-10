export interface ShelfBook {
  id: string;
  slug: string;
  title: string;
  coverUrl?: string | null;
  authors?: { name: string }[];
  distributionStatus?: string;
  readingStatus?: "WANT_TO_READ" | "READING" | "COMPLETED" | null;
  isFavorite?: boolean;
  rating?: number;
  note?: string;
  updatedAt: string;
}

const STORAGE_KEY = "librarian_user_library";

function getStore(): Record<string, ShelfBook> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStore(store: Record<string, ShelfBook>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new Event("librarian_shelf_updated"));
  } catch (err) {
    console.warn("Failed to persist shelf book:", err);
  }
}

export function getAllShelfBooks(): ShelfBook[] {
  const store = getStore();
  return Object.values(store).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getShelfBooksByStatus(status: "WANT_TO_READ" | "READING" | "COMPLETED" | "FAVORITES"): ShelfBook[] {
  const all = getAllShelfBooks();
  if (status === "FAVORITES") {
    return all.filter((b) => b.isFavorite);
  }
  return all.filter((b) => b.readingStatus === status);
}

export function getBookShelfState(slug: string): ShelfBook | null {
  const store = getStore();
  return store[slug] || null;
}

export function setShelfBookStatus(
  book: { id?: string; slug: string; title: string; coverUrl?: string | null; authors?: { name: string }[]; distributionStatus?: string },
  status: "WANT_TO_READ" | "READING" | "COMPLETED" | null
): ShelfBook {
  const store = getStore();
  const existing = store[book.slug] || {
    id: book.id || book.slug,
    slug: book.slug,
    title: book.title,
    coverUrl: book.coverUrl,
    authors: book.authors,
    distributionStatus: book.distributionStatus,
    isFavorite: false,
    updatedAt: new Date().toISOString(),
  };

  existing.readingStatus = status;
  existing.updatedAt = new Date().toISOString();
  if (book.coverUrl) existing.coverUrl = book.coverUrl;
  if (book.title) existing.title = book.title;
  if (book.authors) existing.authors = book.authors;

  // If status is removed and not favorite, we can keep or delete
  store[book.slug] = existing;
  saveStore(store);
  return existing;
}

export function toggleFavoriteBook(
  book: { id?: string; slug: string; title: string; coverUrl?: string | null; authors?: { name: string }[]; distributionStatus?: string }
): boolean {
  const store = getStore();
  const existing = store[book.slug] || {
    id: book.id || book.slug,
    slug: book.slug,
    title: book.title,
    coverUrl: book.coverUrl,
    authors: book.authors,
    distributionStatus: book.distributionStatus,
    readingStatus: null,
    isFavorite: false,
    updatedAt: new Date().toISOString(),
  };

  existing.isFavorite = !existing.isFavorite;
  existing.updatedAt = new Date().toISOString();
  if (book.coverUrl) existing.coverUrl = book.coverUrl;
  if (book.title) existing.title = book.title;
  if (book.authors) existing.authors = book.authors;

  store[book.slug] = existing;
  saveStore(store);
  return existing.isFavorite;
}

export function setShelfBookRating(slug: string, rating: number) {
  const store = getStore();
  if (store[slug]) {
    store[slug].rating = rating;
    store[slug].updatedAt = new Date().toISOString();
    saveStore(store);
  }
}

export function setShelfBookNote(slug: string, note: string) {
  const store = getStore();
  if (store[slug]) {
    store[slug].note = note;
    store[slug].updatedAt = new Date().toISOString();
    saveStore(store);
  }
}

export function removeShelfBook(slug: string) {
  const store = getStore();
  if (store[slug]) {
    delete store[slug];
    saveStore(store);
  }
}
