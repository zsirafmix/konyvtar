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
    viewsCount: 245,
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    postsCount: 2,
    author: {
      id: "admin_seed",
      name: "Könyvtár Admin",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
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
    viewsCount: 182,
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    postsCount: 1,
    author: {
      id: "admin_seed",
      name: "Könyvtár Admin",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      role: "admin",
    },
  },
  {
    id: "topic_scifi_favorites",
    title: "Kedvenc Sci-Fi és Fantasy könyvek – Kinek mi a legnagyobb élménye?",
    slug: "kedvenc-scifi-es-fantasy-konyvek",
    content: "Asimov Alapítvány ciklusa, Frank Herbert Dűnéje, Philip K. Dick disztópiái vagy Stanislaw Lem filozofikus történetei? Melyik volt az a könyv, amit nem bírtatok letenni?",
    isPinned: false,
    isLocked: false,
    viewsCount: 154,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    postsCount: 3,
    author: {
      id: "user_seed_01",
      name: "Kovács Péter",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      role: "superuser",
    },
  },
];

const DEFAULT_FORUM_POSTS: FallbackForumPost[] = [
  {
    id: "post_seed_01",
    topicId: "topic_welcome",
    content: "Köszönjük az új felületet! Nagyon kényelmes az azonnali e-könyv olvasó böngészőből.",
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 6).toISOString(),
    author: {
      id: "user_seed_02",
      name: "Tóth Anna",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      role: "user",
    },
  },
  {
    id: "post_seed_02",
    topicId: "topic_feedback",
    content: "Az automata metaadat-kitöltés hatalmas segítség könyvek feltöltésekor!",
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    author: {
      id: "user_seed_01",
      name: "Kovács Péter",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      role: "superuser",
    },
  },
  {
    id: "post_seed_03",
    topicId: "topic_scifi_favorites",
    content: "Nálam egyértelműen az Alapítvány és Birodalom az abszolút csúcs az Öszvér történetszálával!",
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    author: {
      id: "admin_seed",
      name: "Könyvtár Admin",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      role: "admin",
    },
  },
];

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
