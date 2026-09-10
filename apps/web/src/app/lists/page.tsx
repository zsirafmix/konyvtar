"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ListTree,
  Heart,
  BookOpen,
  Plus,
  X,
  Search,
  Check,
  Sparkles,
  ExternalLink,
  Library,
} from "lucide-react";

interface BookInList {
  slug: string;
  title: string;
  author: string;
  coverUrl?: string;
  rating?: number;
}

interface BookCollection {
  id: string;
  title: string;
  description: string;
  creator: string;
  isEditorial?: boolean;
  likeCount: number;
  books: BookInList[];
}

const EDITORIAL_LISTS: BookCollection[] = [
  {
    id: "l1",
    title: "Alapvető Hard Sci-Fi Mesterművek",
    description:
      "A tudományos fantasztikum legátgondoltabb és legnagyobb hatású regényei az emberiség jövőjéről és a világegyetem törvényeiről.",
    creator: "Könyvtári Kurátori Válogatás",
    isEditorial: true,
    likeCount: 28,
    books: [
      {
        slug: "isaac-asimov-alapitvany-269",
        title: "Alapítvány",
        author: "Isaac Asimov",
        coverUrl: "/api/cover/uBZzGRKT",
        rating: 4.8,
      },
      {
        slug: "arthur-c-clarke-2001-urodisszeia-548",
        title: "2001. Űrodisszeia",
        author: "Arthur C. Clarke",
        coverUrl: "/api/cover/zUAFUaxI",
        rating: 4.7,
      },
      {
        slug: "ray-bradbury-fahrenheit-451-9828",
        title: "Fahrenheit 451",
        author: "Ray Bradbury",
        coverUrl: "/api/cover/2EZSkapQ",
        rating: 4.8,
      },
      {
        slug: "stanislaw-lem-solaris-10255",
        title: "Solaris",
        author: "Stanislaw Lem",
        coverUrl: "/api/cover/E694tS7T",
        rating: 4.6,
      },
    ],
  },
  {
    id: "l2",
    title: "A Magyar Irodalom Örök Klasszikusai",
    description:
      "Időtálló remekművek és felejthetetlen gondolatok a huszadik századi magyar próza mestereitől.",
    creator: "Könyvtári Kurátori Válogatás",
    isEditorial: true,
    likeCount: 35,
    books: [
      {
        slug: "szerb-antal-utas-es-holdvilag-10335",
        title: "Utas és holdvilág",
        author: "Szerb Antal",
        coverUrl: "/api/cover/yFRRgRbK",
        rating: 4.9,
      },
      {
        slug: "marai-sandor-a-gyertyak-csonkig-egnek-4300",
        title: "A gyertyák csonkig égnek",
        author: "Márai Sándor",
        coverUrl: "/api/cover/mcAHzKYJ",
        rating: 4.8,
      },
      {
        slug: "rejto-jeno-01-a-tizennegy-karatos-autox-10474",
        title: "A tizennégy karátos autó",
        author: "Rejtő Jenő",
        coverUrl: "/api/cover/fZ4RGQQb",
        rating: 4.8,
      },
    ],
  },
  {
    id: "l3",
    title: "Izgalmas Rejtélyek, Krimik és Kalandok",
    description:
      "Klasszikus detektívregények, szellemes nyomozások és kalandos utazások a rejtélyek kedvelőinek.",
    creator: "Könyvtári Kurátori Válogatás",
    isEditorial: true,
    likeCount: 19,
    books: [
      {
        slug: "agatha-christie-tiz-kicsi-neger-1384",
        title: "Tíz kicsi néger",
        author: "Agatha Christie",
        coverUrl: "/api/cover/SdRmALhL",
        rating: 4.9,
      },
      {
        slug: "robert-van-gulik-a-faragott-paravan-rejtelye-3748",
        title: "A faragott paraván rejtélye",
        author: "Robert van Gulik",
        coverUrl: "/api/cover/G3gXlS2a",
        rating: 4.6,
      },
      {
        slug: "jules-verne-80-nap-alatt-a-fold-korul-8802",
        title: "80 nap alatt a Föld körül",
        author: "Jules Verne",
        coverUrl: "/api/cover/OIA3HaBB",
        rating: 4.7,
      },
    ],
  },
];

export default function ListsPage() {
  const [customLists, setCustomLists] = useState<BookCollection[]>([]);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [selectedList, setSelectedList] = useState<BookCollection | null>(null);

  // New list modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedBooks, setSelectedBooks] = useState<BookInList[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load custom lists and likes from localStorage
  useEffect(() => {
    try {
      const savedLists = localStorage.getItem("librarian_custom_lists");
      if (savedLists) {
        setCustomLists(JSON.parse(savedLists));
      }
      const savedLikes = localStorage.getItem("librarian_liked_lists");
      if (savedLikes) {
        setLikedIds(JSON.parse(savedLikes));
      }
    } catch {
      // Non-fatal
    }
  }, []);

  const allLists = [...EDITORIAL_LISTS, ...customLists];

  const handleToggleLike = (listId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isLiked = !likedIds[listId];
    const newLiked = { ...likedIds, [listId]: isLiked };
    setLikedIds(newLiked);
    localStorage.setItem("librarian_liked_lists", JSON.stringify(newLiked));
  };

  // Search books for adding to custom list
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search?type=books&q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.books || []);
        }
      } catch {
        // Ignore
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectBook = (b: any) => {
    const isAlready = selectedBooks.some((sb) => sb.slug === b.slug);
    if (isAlready) {
      setSelectedBooks(selectedBooks.filter((sb) => sb.slug !== b.slug));
    } else {
      setSelectedBooks([
        ...selectedBooks,
        {
          slug: b.slug,
          title: b.title,
          author: b.authors?.[0]?.name || "Ismeretlen szerző",
          coverUrl: b.coverUrl,
          rating: b.averageRating,
        },
      ]);
    }
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newList: BookCollection = {
      id: `custom_list_${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim() || "Olvasói gyűjtemény a Librarian AI katalógusából.",
      creator: "Saját lista",
      likeCount: 0,
      books: selectedBooks,
    };

    const updated = [newList, ...customLists];
    setCustomLists(updated);
    localStorage.setItem("librarian_custom_lists", JSON.stringify(updated));

    // Reset form
    setNewTitle("");
    setNewDescription("");
    setSelectedBooks([]);
    setSearchQuery("");
    setShowCreateModal(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Közösségi Listák</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kurátori és olvasói tematikus könyvgyűjtemények a 11 472 kötetes gyűjteményből.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Új lista létrehozása</span>
        </button>
      </div>

      {/* Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allLists.map((l) => {
          const isLiked = Boolean(likedIds[l.id]);
          const currentLikes = l.likeCount + (isLiked ? 1 : 0);

          return (
            <div
              key={l.id}
              onClick={() => setSelectedList(l)}
              className="p-6 rounded-3xl bg-card border border-border space-y-4 hover:border-primary/50 transition-all shadow-sm cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Book Covers Collage */}
                <div className="flex -space-x-4 overflow-hidden py-1 h-24 items-center">
                  {l.books.slice(0, 4).map((b, i) => (
                    <div
                      key={i}
                      className="w-16 aspect-[2/3] rounded-lg shadow-md border-2 border-card overflow-hidden bg-secondary shrink-0 relative group-hover:scale-105 transition-transform"
                    >
                      {b.coverUrl ? (
                        <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-1 bg-secondary text-[9px] text-center text-muted-foreground font-semibold">
                          {b.title}
                        </div>
                      )}
                    </div>
                  ))}
                  {l.books.length > 4 && (
                    <div className="w-10 h-10 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-xs font-bold text-muted-foreground shadow-sm">
                      +{l.books.length - 4}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                      {l.title}
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {l.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs text-muted-foreground mt-2">
                <span className="truncate max-w-[170px]">
                  {l.isEditorial ? (
                    <span className="text-primary font-semibold">🏛️ Kurátori Válogatás</span>
                  ) : (
                    <span>Készítette: {l.creator}</span>
                  )}
                </span>

                <button
                  type="button"
                  onClick={(e) => handleToggleLike(l.id, e)}
                  className={`flex items-center gap-1 font-semibold transition-colors px-2 py-1 rounded-full ${
                    isLiked ? "text-red-500 bg-red-500/10" : "hover:text-red-500"
                  }`}
                  title={isLiked ? "Kedvelés visszavonása" : "Lista kedvelése"}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
                  <span>{currentLikes}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected List Detail Modal */}
      {selectedList && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-border flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ListTree className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold text-foreground">{selectedList.title}</h2>
                </div>
                <p className="text-xs text-muted-foreground">{selectedList.description}</p>
                <div className="text-[11px] text-muted-foreground pt-1 flex items-center gap-3">
                  <span>Összeállító: <strong className="text-foreground">{selectedList.creator}</strong></span>
                  <span>•</span>
                  <span>{selectedList.books.length} könyv</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedList(null)}
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 divide-y divide-border/50">
              {selectedList.books.map((book, idx) => (
                <div key={idx} className="pt-4 first:pt-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 aspect-[2/3] rounded-md overflow-hidden bg-secondary shrink-0 shadow-sm">
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] p-1 text-center font-bold text-muted-foreground">
                          {book.title}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/book/${book.slug}`}
                        onClick={() => setSelectedList(null)}
                        className="font-bold text-sm text-foreground hover:text-primary transition-colors block truncate"
                      >
                        {book.title}
                      </Link>
                      <span className="text-xs text-muted-foreground block truncate">{book.author}</span>
                      {book.rating && (
                        <span className="text-[11px] text-amber-500 font-semibold">★ {book.rating}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/read/${book.slug}`}
                      onClick={() => setSelectedList(null)}
                      className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Olvasás</span>
                    </Link>
                    <Link
                      href={`/book/${book.slug}`}
                      onClick={() => setSelectedList(null)}
                      className="p-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs"
                      title="Adatlap"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Custom List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Új Olvasási Lista</h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Lista elnevezése *</label>
                <input
                  type="text"
                  required
                  placeholder="pl. Kedvenc őszi regényeim"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Rövid leírás</label>
                <textarea
                  rows={2}
                  placeholder="Miről szól ez a gyűjtemény?"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Book search to add books */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <label className="text-xs font-semibold text-muted-foreground">
                  Könyvek hozzáadása a gyűjteményből ({selectedBooks.length} kiválasztva)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Keress könyvre cím vagy szerző alapján..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {searchLoading && (
                  <div className="text-xs text-muted-foreground text-center py-2">Keresés a könyvek között...</div>
                )}

                {searchResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-secondary/30 rounded-xl border border-border">
                    {searchResults.map((b) => {
                      const isSelected = selectedBooks.some((sb) => sb.slug === b.slug);
                      return (
                        <div
                          key={b.id || b.slug}
                          onClick={() => handleSelectBook(b)}
                          className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors ${
                            isSelected ? "bg-primary/20 text-primary font-semibold" : "hover:bg-secondary text-foreground"
                          }`}
                        >
                          <div className="truncate mr-2">
                            <span className="font-bold">{b.title}</span> – {b.authors?.[0]?.name || "Ismeretlen"}
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selected books preview */}
                {selectedBooks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {selectedBooks.map((sb) => (
                      <span
                        key={sb.slug}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-semibold"
                      >
                        <span className="max-w-[150px] truncate">{sb.title}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedBooks(selectedBooks.filter((x) => x.slug !== sb.slug))}
                          className="hover:text-red-500 cursor-pointer ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  Lista Mentése
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
