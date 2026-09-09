export interface FallbackChatRoom {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  createdById?: string;
}

export interface FallbackChatMessage {
  id: string;
  roomId: string;
  content: string;
  createdAt: string;
  isDeleted: boolean;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: "admin" | "moderator" | "superuser" | "user";
    isSupporter: boolean;
  };
}

const DEFAULT_ROOMS: FallbackChatRoom[] = [
  {
    id: "room_altalanos",
    name: "Általános Társalgó",
    slug: "altalanos",
    description: "Általános olvasói társalgó és kötetlen beszélgetés",
    isDefault: true,
    createdAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "room_konyvek",
    name: "Könyvajánlók & Tippek",
    slug: "konyvek",
    description: "Ajánlj könyveket és kérj személyes tippeket másoktól",
    isDefault: false,
    createdAt: new Date("2024-01-02").toISOString(),
  },
  {
    id: "room_scifi",
    name: "Sci-Fi & Fantasztikum",
    slug: "scifi",
    description: "Űrutazás, cyberpunk, fantasy világok, disztópiák és mágia",
    isDefault: false,
    createdAt: new Date("2024-01-03").toISOString(),
  },
  {
    id: "room_technika",
    name: "Technika & AI",
    slug: "technika",
    description: "Digitális könyvtári fejlesztések, technológia és AI Könyvtáros",
    isDefault: false,
    createdAt: new Date("2024-01-04").toISOString(),
  },
];

const DEFAULT_SEED_MESSAGES: FallbackChatMessage[] = [
  {
    id: "msg_seed_01",
    roomId: "room_altalanos",
    content: "Üdvözlünk minden kedves olvasót a Librarian AI megújult közösségi csevegőjében! 📚 Nyugodtan osszátok meg tapasztalataitokat vagy kérdezzetek a könyvekről.",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    isDeleted: false,
    author: {
      id: "admin_seed",
      name: "Könyvtár Admin",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      role: "admin",
      isSupporter: true,
    },
  },
  {
    id: "msg_seed_02",
    roomId: "room_altalanos",
    content: "Sziasztok! Fantasztikus lett az új csempés főoldal és a közvetlen olvasó. Végre egy modern magyar könyvtári felület! 🚀",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    isDeleted: false,
    author: {
      id: "user_seed_01",
      name: "Kovács Péter",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      role: "superuser",
      isSupporter: true,
    },
  },
  {
    id: "msg_seed_03",
    roomId: "room_konyvek",
    content: "Tudtok ajánlani egy igazán jó, fordulatos sci-fi vagy történelmi regényt a hétvégére?",
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    isDeleted: false,
    author: {
      id: "user_seed_02",
      name: "Tóth Anna",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      role: "user",
      isSupporter: false,
    },
  },
  {
    id: "msg_seed_04",
    roomId: "room_konyvek",
    content: "Ha még nem olvastad, az Alapítvány első kötetét mindenképp vedd kézbe! Frank Herbert Dűnéje is fenomenális.",
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    isDeleted: false,
    author: {
      id: "admin_seed",
      name: "Könyvtár Admin",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      role: "admin",
      isSupporter: true,
    },
  },
  {
    id: "msg_seed_05",
    roomId: "room_scifi",
    content: "Ki milyen sorrendben szereti olvasni Asimov univerzumát? A Robot regényekkel kezditek vagy közvetlenül a pszichohistóriával?",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    isDeleted: false,
    author: {
      id: "user_seed_01",
      name: "Kovács Péter",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      role: "superuser",
      isSupporter: true,
    },
  },
  {
    id: "msg_seed_06",
    roomId: "room_technika",
    content: "Az AI Könyvtáros most már közvetlenül a Magyar Wikipédia és Google Books adatait használja, és a MEGA könyvtár valós címeire hivatkozik!",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    isDeleted: false,
    author: {
      id: "admin_seed",
      name: "Könyvtár Admin",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      role: "admin",
      isSupporter: true,
    },
  },
];

declare global {
  var fallbackChatRoomsGlobal: FallbackChatRoom[] | undefined;
  var fallbackChatMessagesGlobal: FallbackChatMessage[] | undefined;
}

if (!globalThis.fallbackChatRoomsGlobal) {
  globalThis.fallbackChatRoomsGlobal = [...DEFAULT_ROOMS];
}
if (!globalThis.fallbackChatMessagesGlobal) {
  globalThis.fallbackChatMessagesGlobal = [...DEFAULT_SEED_MESSAGES];
}

export function getFallbackChatRooms(): FallbackChatRoom[] {
  if (!globalThis.fallbackChatRoomsGlobal || globalThis.fallbackChatRoomsGlobal.length === 0) {
    globalThis.fallbackChatRoomsGlobal = [...DEFAULT_ROOMS];
  }
  return globalThis.fallbackChatRoomsGlobal;
}

export function getFallbackChatMessages(): FallbackChatMessage[] {
  if (!globalThis.fallbackChatMessagesGlobal) {
    globalThis.fallbackChatMessagesGlobal = [...DEFAULT_SEED_MESSAGES];
  }
  return globalThis.fallbackChatMessagesGlobal;
}
