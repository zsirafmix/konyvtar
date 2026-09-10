export interface FallbackForumTopic {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  postsCount: number;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  };
}

export interface FallbackForumPost {
  id: string;
  topicId: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  };
}

const DEFAULT_FORUM_TOPICS: FallbackForumTopic[] = [
  {
    id: "topic_welcome",
    title: "Üdvözlünk a megújult Librarian AI közösségi fórumán! 🎉",
    slug: "udvozlet-a-megujult-librarian-ai-foruman",
    content: "Örömmel köszöntünk minden olvasót és könyvbarátot a digitális könyvtárunkban! A fórum célja a kötetlen eszmecsere, olvasási élmények megosztása és a könyvtár fejlesztésének támogatása. Kérdezz bátran az AI Könyvtárostól vagy beszélgess a többi taggal.",
    isPinned: true,
    isLocked: false,
    viewsCount: 12,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    postsCount: 0,
    author: {
      id: "admin_seed",
      name: "Könyvtári Hírmondó",
      avatarUrl: null,
      role: "admin",
    },
  },
  {
    id: "topic_feedback",
    title: "Milyen új funkciókat és könyveket látnátok szívesen a könyvtárban?",
    slug: "milyen-uj-funkciokat-latnatok-szivesen",
    content: "Folyamatosan fejlesztjük az oldalt (új csempés dashboard, automatikus borítófelismerés a feltöltéseknél, AI Könyvtáros Wikipedia groundinggal). Ha van bármilyen észrevételed vagy könyvkérésed, oszd meg velünk ebben a témában!",
    isPinned: true,
    isLocked: false,
    viewsCount: 8,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    postsCount: 0,
    author: {
      id: "admin_seed",
      name: "Könyvtári Hírmondó",
      avatarUrl: null,
      role: "admin",
    },
  },
  {
    id: "topic_scifi_favorites",
    title: "Kedvenc könyveid – Kinek mi a legnagyobb olvasmányélménye?",
    slug: "kedvenc-konyveid-legnagyobb-elmeny",
    content: "Asimov Alapítvány ciklusa, Frank Herbert Dűnéje, Szerb Antal remekművei vagy Rejtő Jenő regényei? Melyik volt az a könyv a gyűjteményből, amit nem bírtatok letenni? Oszd meg gondolataidat!",
    isPinned: false,
    isLocked: false,
    viewsCount: 15,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    postsCount: 0,
    author: {
      id: "admin_seed",
      name: "Könyvtári Hírmondó",
      avatarUrl: null,
      role: "admin",
    },
  },
];

const DEFAULT_FORUM_POSTS: FallbackForumPost[] = [];

declare global {
  var fallbackForumTopicsGlobal: FallbackForumTopic[] | undefined;
  var fallbackForumPostsGlobal: FallbackForumPost[] | undefined;
}

if (!globalThis.fallbackForumTopicsGlobal) {
  globalThis.fallbackForumTopicsGlobal = [...DEFAULT_FORUM_TOPICS];
}
if (!globalThis.fallbackForumPostsGlobal) {
  globalThis.fallbackForumPostsGlobal = [...DEFAULT_FORUM_POSTS];
}

export function getFallbackForumTopics(): FallbackForumTopic[] {
  if (!globalThis.fallbackForumTopicsGlobal) {
    globalThis.fallbackForumTopicsGlobal = [...DEFAULT_FORUM_TOPICS];
  }
  return globalThis.fallbackForumTopicsGlobal;
}

export function getFallbackForumPosts(): FallbackForumPost[] {
  if (!globalThis.fallbackForumPostsGlobal) {
    globalThis.fallbackForumPostsGlobal = [...DEFAULT_FORUM_POSTS];
  }
  return globalThis.fallbackForumPostsGlobal;
}
