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
    id: "msg_system_01",
    roomId: "room_altalanos",
    content: "Üdvözlünk a Librarian AI élő közösségi csevegőjében! 📚 Itt valós időben beszélgethetsz más olvasókkal a könyvekről, vagy oszthatsz meg ajánlókat.",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isDeleted: false,
    author: {
      id: "system_bot",
      name: "Könyvtári Rendszer",
      avatarUrl: null,
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
