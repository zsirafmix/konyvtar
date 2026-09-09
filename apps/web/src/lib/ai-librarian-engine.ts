import { BookItem } from "@librarian/ai";

export interface AIKnowledgeContext {
  wikiTitle?: string;
  wikiExtract?: string;
  wikiUrl?: string;
  googleDescription?: string;
  googleCategories?: string[];
  googlePublishedYear?: number;
  authorBio?: string;
}

/**
 * Fetch knowledge from Hungarian Wikipedia REST API
 */
export async function fetchHungarianWikipedia(query: string): Promise<AIKnowledgeContext | null> {
  try {
    const cleanQuery = query
      .replace(/[?!,.]/g, "")
      .replace(/\b(könyv|regény|sorrend|sorrendben|olvassam|miről szól|ki az a|kicsoda|ajánlj|ajánlanál)\b/gi, "")
      .trim();

    if (!cleanQuery) return null;

    // 1. First search via Wikipedia search API
    const searchUrl = `https://hu.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&utf8=&format=json`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const sRes = await fetch(searchUrl, {
      headers: { "User-Agent": "LibrarianAI/2.0 (contact: info@konyvtar.ai)" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!sRes.ok) return null;
    const sData = await sRes.json();
    const hit = sData.query?.search?.[0];
    if (!hit || !hit.title) return null;

    // 2. Fetch summary of top hit
    const sumUrl = `https://hu.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`;
    const sumController = new AbortController();
    const sumTimeout = setTimeout(() => sumController.abort(), 3000);

    const sumRes = await fetch(sumUrl, {
      headers: { "User-Agent": "LibrarianAI/2.0 (contact: info@konyvtar.ai)" },
      signal: sumController.signal,
    });
    clearTimeout(sumTimeout);

    if (!sumRes.ok) return null;
    const sumData = await sumRes.json();

    if (sumData.extract && !sumData.extract.includes("egyértelműsítő lap")) {
      return {
        wikiTitle: sumData.title,
        wikiExtract: sumData.extract,
        wikiUrl: sumData.content_urls?.desktop?.page,
      };
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Fetch volume and plot details from Google Books API
 */
export async function fetchGoogleBooksDetails(query: string): Promise<AIKnowledgeContext | null> {
  try {
    const cleanQuery = query
      .replace(/[?!,.]/g, "")
      .replace(/\b(könyv|regény|sorrend|sorrendben|olvassam|miről szól|ki az a|kicsoda|ajánlj)\b/gi, "")
      .trim();

    if (!cleanQuery) return null;

    const gUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(cleanQuery)}&maxResults=3&langRestrict=hu`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(gUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    const item = data.items?.[0]?.volumeInfo;

    if (item) {
      return {
        googleDescription: item.description,
        googleCategories: item.categories,
        googlePublishedYear: item.publishedDate ? parseInt(item.publishedDate.substring(0, 4), 10) : undefined,
      };
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Call external LLM if any API key is configured in environment
 */
export async function queryExternalLLM(prompt: string): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.AI_PROVIDER_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  // 1. Try Gemini API if key available
  if (geminiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1000 },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 20) return text.trim();
      }
    } catch (e) {
      console.warn("Gemini API call failed:", e);
    }
  }

  // 2. Try Groq API if key available
  if (groqKey) {
    try {
      const url = "https://api.groq.com/openai/v1/chat/completions";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
          max_tokens: 1000,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.trim().length > 20) return text.trim();
      }
    } catch (e) {
      console.warn("Groq API call failed:", e);
    }
  }

  // 3. Try OpenRouter free models if key available
  if (openRouterKey) {
    try {
      const url = "https://openrouter.ai/api/v1/chat/completions";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterKey}`,
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.2-3b-instruct:free",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
          max_tokens: 1000,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.trim().length > 20) return text.trim();
      }
    } catch (e) {
      console.warn("OpenRouter API call failed:", e);
    }
  }

  return null;
}

/**
 * Famous literary series chronologies & reading orders for Hungarian readers
 */
const FAMOUS_SERIES_ORDERS: Record<
  string,
  { name: string; author: string; recommendedOrder: string[]; advice: string }
> = {
  alapitvany: {
    name: "Alapítvány-Birodalom-Robot ciklus",
    author: "Isaac Asimov",
    recommendedOrder: [
      "1. Én, a robot (vagy A robotok teljes története) – A robotika három törvénye és a pozitronagy kezdetei",
      "2. Acélbarlangok (Elijah Baley és R. Daneel Olivaw nyomozásai)",
      "3. A mezítelen nap",
      "4. A Hajnal bolygó robotjai",
      "5. Robotok és Birodalom (a robot és birodalmi korszak hídja)",
      "6. Alapítvány (1951) – A Hari Seldon által indított pszichohistória alapköve",
      "7. Alapítvány és Birodalom (1952) – Az Öszvér megjelenése",
      "8. Második Alapítvány (1953) – A szellemi vezetők harca",
      "9. Az Alapítvány pereme (1982)",
      "10. Alapítvány és Föld (1986) – A nagy szintézis",
      "Kiegészítő előzménykötetek (érdemes a klasszikus trilógia után olvasni): Előjáték az Alapítványhoz, Előre az Alapítványhoz",
    ],
    advice: "Kezdőknek kifejezetten az eredeti Alapítvány-trilógiát (Alapítvány, Alapítvány és Birodalom, Második Alapítvány) javasolt először elolvasni, mert ez nyújtja a legkatartikusabb irodalmi élményt!",
  },
  dune: {
    name: "Dűne-univerzum (eredeti Frank Herbert kötetek)",
    author: "Frank Herbert",
    recommendedOrder: [
      "1. A Dűne (1965) – Paul Atreides és az Arrakis fűszerbolygó felemelkedése",
      "2. A Dűne messiása (1969) – A hatalom tragédiája és ára",
      "3. A Dűne gyermekei (1976) – Leto és Ghanima története",
      "4. A Dűne istencsászára (1981) – II. Leto évezredes Arany Ösvénye",
      "5. A Dűne eretnekei (1984) – A Bene Gesserit megújulása",
      "6. A Dűne Káptalandomb (1985) – Frank Herbert utolsó befejezett regénye",
    ],
    advice: "A Dűnét szigorúan a fenti kiadási sorrendben kell olvasni. Az első regény önmagában is kerek remekmű, de a Messiás és a Gyermekei teszi teljessé Paul Atreides sorsát.",
  },
  vajak: {
    name: "Vaják (Witcher) saga",
    author: "Andrzej Sapkowski",
    recommendedOrder: [
      "1. Az utolsó kívánság (novelláskötet – a karakterek és a világ megalapozása)",
      "2. A végzet kardja (novelláskötet – Ciri és Ríviai Geralt sorsának összefonódása)",
      "3. Tündevér (a nagy összefüggő regényciklus 1. része)",
      "4. A megvetés ideje (2. rész)",
      "5. Tűzkeresztség (3. rész)",
      "6. Fecske-torony (4. rész)",
      "7. A Tó Úrnője (5. rész)",
      "Különálló ráadás: Viharidő (önálló kaland Geralttal)",
    ],
    advice: "Soha ne kezdd a Tündevér regénnyel a novellák nélkül! Az utolsó kívánság és A végzet kardja adja a teljes saga érzelmi és cselekménybeli alapját.",
  },
  harrypotter: {
    name: "Harry Potter sorozat",
    author: "J.K. Rowling",
    recommendedOrder: [
      "1. Harry Potter és a bölcsek köve",
      "2. Harry Potter és a Titkok Kamrája",
      "3. Harry Potter és az azkabani fogoly",
      "4. Harry Potter és a Tűz Serlege",
      "5. Harry Potter és a Főnix Rendje",
      "6. Harry Potter és a Félvér Herceg",
      "7. Harry Potter és a Halál ereklyéi",
    ],
    advice: "A sorozat kötetei lineáris kronológiát követnek Harry egy-egy roxforti tanéve során, így kizárólag ebben a sorrendben ajánlott olvasni.",
  },
  gyurukura: {
    name: "Középfölde / A Gyűrűk Ura",
    author: "J.R.R. Tolkien",
    recommendedOrder: [
      "1. A hobbit (vagy A babó) – Könnyed, mesés bevezetés Középföldére",
      "2. A Gyűrűk Ura I.: A Gyűrű Szövetsége",
      "3. A Gyűrűk Ura II.: A két torony",
      "4. A Gyűrűk Ura III.: A király visszatér",
      "5. A szilmarilok (mély mitológiai háttér, Arda teremtése és az első korok)",
      "6. Befejezetlen regék Középföldéről és Númenorról",
    ],
    advice: "A hobbit elolvasása után A Gyűrűk Ura trilógia a fő mű; A szilmarilokat csak a trilógia után érdemes kézbe venni annak enciklopédikus mélysége miatt.",
  },
  rejto: {
    name: "Rejtő Jenő (P. Howard) légiós és humoros regényei",
    author: "Rejtő Jenő",
    recommendedOrder: [
      "1. A tizennégy karátos autó (Gorcsev Iván és a Nobel-díj legendás kezdete)",
      "2. A három testőr Afrikában (Csülök, Senki Alfonz és Tuskó Hopkins)",
      "3. Piszkos Fred, a kapitány (A Csendes-óceán réme és Fülig Jimmy)",
      "4. Piszkos Fred közbelép (Fülig Jimmy őszinte sajnálatára)",
      "5. Az elveszett cirkáló",
      "6. Az előretolt helyőrség (Galamb és Troppauer Hümér)",
      "7. A láthatatlan légió",
      "8. Vesztegzár a Grand Hotelben (Felix van der Goude és a bubópestis-komédia)",
    ],
    advice: "Rejtő regényei önmagukban is zseniálisak és önállóan is olvashatók, de a Piszkos Fred és a három jómadár kalandjait a fenti sorrendben a legszórakoztatóbb élvezni.",
  },
  lem: {
    name: "Stanisław Lem filozofikus sci-fi művei",
    author: "Stanisław Lem",
    recommendedOrder: [
      "1. Solaris (1961) – Az élő, gondolkodó óceán és az emberi megismerés határai",
      "2. Kiberiáda (Trurl és Klapanciusz konstruktőrök zseniális gépmeséi)",
      "3. Csillagnapló (Ijon Tichy űrutazó abszurd és mélyenszántó kalandjai)",
      "4. Az Úr hangja (A földönkívüli üzenet megfejtésének dilemmája)",
      "5. Éden (Kényszerleszállás és a megérthetetlen civilizáció)",
      "6. Visszatérés (A csillagokból megtért űrhajós és a betiltott agresszió világa)",
    ],
    advice: "Kezdésnek a Solaris adja a legmélyebb filozófiai élményt, míg a humorosabb, szatírikus oldalért a Kiberiáda a legjobb belépő Lem világába.",
  },
  clarke: {
    name: "Arthur C. Clarke Űrodisszeia ciklusa",
    author: "Arthur C. Clarke",
    recommendedOrder: [
      "1. 2001. Űrodisszeia (A titokzatos fekete monolit és a HAL 9000)",
      "2. 2010. Második űrodisszeia (A Jupiter csillaggá válása és az Europa védelme)",
      "3. 2061. Harmadik űrodisszeia (A Halley-üstökös expedíciója)",
      "4. 3001. Végső űrodisszeia (Frank Poole feltámadása és a monolitok végzete)",
      "Önálló remekmű: Randevú a Rámával (Az idegen csillaghajó felfedezése)",
    ],
    advice: "A négy Űrodisszeia kötet szorosan összefügg, pontosan ebben a megjelenési és belső időrendben érdemes olvasni.",
  },
  adams: {
    name: "Galaxis útikalauz stopposoknak (öt részes trilógia)",
    author: "Douglas Adams",
    recommendedOrder: [
      "1. Galaxis útikalauz stopposoknak (Arthur Dent, Ford Prefect és a 42-es válasz)",
      "2. Vendéglő a világ végén (Milliways és az univerzum pusztulásának látványa)",
      "3. Az élet, a világmindenség, meg minden",
      "4. Viszlát, és kösz a halakat!",
      "5. Jobbára ártalmatlan",
    ],
    advice: "Szigorúan az 1. kötettel kezdj, és ne felejtsd otthon a törülköződet!",
  },
  orwell: {
    name: "George Orwell politikai és társadalmi disztópiái",
    author: "George Orwell",
    recommendedOrder: [
      "1. Állatfarm (1945) – Zseniális szatíra a hatalom megrontó természetéről",
      "2. 1984 (1949) – Winston Smith tragédiája, a Gondolatrendőrség és a Nagy Testvér",
      "3. Hódolat Katalóniának (Önéletrajzi beszámoló a spanyol polgárháborúról)",
    ],
    advice: "Az Állatfarm tökéletes és gyors bevezetés Orwell szimbolikájába, amelyet a felkavaró mélységű 1984 tesz teljessé.",
  },
};

/**
 * Intelligent Hungarian AI Librarian synthesizer
 */
export function synthesizeHungarianLibrarianAnswer(
  query: string,
  matchedBooks: BookItem[],
  wikiContext: AIKnowledgeContext | null,
  googleContext: AIKnowledgeContext | null
): string {
  const norm = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 1. Check for famous series reading order request
  for (const [key, series] of Object.entries(FAMOUS_SERIES_ORDERS)) {
    if (
      norm.includes(key) ||
      norm.includes(series.author.toLowerCase()) ||
      (key === "alapitvany" && (norm.includes("asimov") || norm.includes("foundation"))) ||
      (key === "dune" && (norm.includes("herbert") || norm.includes("dune") || norm.includes("arrakis"))) ||
      (key === "vajak" && (norm.includes("witcher") || norm.includes("geralt") || norm.includes("sapkowski"))) ||
      (key === "harrypotter" && (norm.includes("potter") || norm.includes("rowling"))) ||
      (key === "gyurukura" && (norm.includes("tolkien") || norm.includes("gyuruk") || norm.includes("frodo"))) ||
      (key === "rejto" && (norm.includes("rejto") || norm.includes("piszkos fred") || norm.includes("gorcsev") || norm.includes("legio"))) ||
      (key === "lem" && (norm.includes("lem") || norm.includes("solaris") || norm.includes("kiberiada"))) ||
      (key === "clarke" && (norm.includes("clarke") || norm.includes("urodisszeia") || norm.includes("2001"))) ||
      (key === "adams" && (norm.includes("adams") || norm.includes("galaxis") || norm.includes("utikalauz") || norm.includes("stoppos"))) ||
      (key === "orwell" && (norm.includes("orwell") || norm.includes("1984") || norm.includes("allatfarm")))
    ) {
      if (
        norm.includes("sorrend") ||
        norm.includes("hogyan") ||
        norm.includes("melyik") ||
        norm.includes("kezd") ||
        norm.includes("olvassam") ||
        norm.includes("kötet")
      ) {
        let answer = `### 📚 ${series.name} – Ajánlott olvasási sorrend\n\n`;
        answer += `**Szerző:** ${series.author}\n\n`;
        answer += `A sorozat köteteit a következő logikai és kanonikus sorrendben érdemes olvasni a legteljesebb élményért:\n\n`;
        for (const item of series.recommendedOrder) {
          answer += `* ${item}\n`;
        }
        answer += `\n> **Könyvtáros tanácsa:** ${series.advice}\n\n`;

        if (matchedBooks.length > 0) {
          answer += `#### 📖 A könyvtáradban azonnal elérhető kötetek ebből a ciklusból:\n`;
          for (const b of matchedBooks.slice(0, 5)) {
            answer += `* **[${b.title}](/book/${b.slug || b.id})** – ${b.authors.map((a) => a.name).join(", ")}${b.publishedYear ? ` (${b.publishedYear})` : ""}\n`;
          }
        }
        return answer;
      }
    }
  }

  // 2. Author Inquiry (e.g. "Kicsoda Isaac Asimov?", "Mesélj Stephen Kingről")
  const isAuthorQuery =
    norm.includes("kicsoda") ||
    norm.includes("ki az a") ||
    norm.includes("ki volt") ||
    norm.includes("mesélj") ||
    norm.includes("életrajz") ||
    norm.includes("szerző");

  if (isAuthorQuery && (wikiContext?.wikiExtract || matchedBooks.length > 0)) {
    let answer = `### ✍️ Szerzői Portré: ${wikiContext?.wikiTitle || matchedBooks[0]?.authors[0]?.name || "Keresett Szerző"}\n\n`;

    if (wikiContext?.wikiExtract) {
      answer += `${wikiContext.wikiExtract}\n\n`;
    }

    if (matchedBooks.length > 0) {
      answer += `#### 📚 A könyvtáradban megtalálható művei:\n`;
      for (const b of matchedBooks.slice(0, 6)) {
        const rating = b.averageRating ? ` ★ ${b.averageRating.toFixed(1)}` : "";
        answer += `* **[${b.title}](/book/${b.slug || b.id})**${b.publishedYear ? ` (${b.publishedYear})` : ""}${rating} – *${b.categories[0]?.name || "Könyv"}*\n`;
        if (b.description) {
          const shortDesc = b.description.slice(0, 140).replace(/<[^>]+>/g, "").trim();
          answer += `  _${shortDesc}..._\n`;
        }
      }
      answer += `\n*Kattints a fenti könyvekre az azonnali olvasáshoz vagy letöltéshez!*`;
    }
    return answer;
  }

  // 3. Book Synopsis / Plot Inquiry (e.g. "Miről szól az Alapítvány?", "Dűne története")
  const isPlotQuery =
    norm.includes("miről szól") ||
    norm.includes("tartalom") ||
    norm.includes("cselekmény") ||
    norm.includes("történet") ||
    norm.includes("ismertető") ||
    norm.includes("összefoglaló");

  if (isPlotQuery) {
    const bookTitle = wikiContext?.wikiTitle || matchedBooks[0]?.title || "A kérdezett mű";
    let answer = `### 📖 Ismertető és cselekmény: ${bookTitle}\n\n`;

    if (wikiContext?.wikiExtract) {
      answer += `${wikiContext.wikiExtract}\n\n`;
    } else if (googleContext?.googleDescription) {
      answer += `${googleContext.googleDescription.slice(0, 500).replace(/<[^>]+>/g, "")}...\n\n`;
    } else if (matchedBooks[0]?.description) {
      answer += `${matchedBooks[0].description.slice(0, 500).replace(/<[^>]+>/g, "")}...\n\n`;
    }

    if (matchedBooks.length > 0) {
      answer += `#### 📥 Elérhetőség a könyvtáradban:\n`;
      const top = matchedBooks[0];
      answer += `* **[${top.title}](/book/${top.slug || top.id})** – Szerző: **${top.authors.map((a) => a.name).join(", ")}**`;
      if (top.publishedYear) answer += ` (${top.publishedYear})`;
      answer += `\n\nA könyv teljes szöveggel, közvetlen formátumokban elérhető az olvasóban vagy letöltésként!`;
    }
    return answer;
  }

  // 4. Recommendation / "Mit olvassak?" Inquiry
  const isRecommendation =
    norm.includes("mit olvassak") ||
    norm.includes("ajánlj") ||
    norm.includes("ajánlanál") ||
    norm.includes("tipp") ||
    norm.includes("keresek") ||
    norm.includes("kedvenc") ||
    norm.includes("legjobb");

  if (isRecommendation || matchedBooks.length > 0) {
    let answer = `### 🌟 Könyvtáros Ajánló az igényeidre szabva\n\n`;

    if (wikiContext?.wikiExtract) {
      answer += `> _"${wikiContext.wikiExtract.slice(0, 220)}..."_\n\n`;
    }

    answer += `A könyvtár 11 472 kötetes állományából az alábbi kiemelkedő, azonnal olvasható műveket ajánlom:\n\n`;

    for (let i = 0; i < Math.min(matchedBooks.length, 5); i++) {
      const b = matchedBooks[i];
      const authorStr = b.authors.map((a) => a.name).join(", ") || "Klasszikus szerző";
      const genreStr = b.categories[0]?.name || "Ajánlott olvasmány";
      answer += `**${i + 1}. [${b.title}](/book/${b.slug || b.id})** – ${authorStr}${b.publishedYear ? ` (${b.publishedYear})` : ""}\n`;
      answer += `   * Kategória: **${genreStr}** • Értékelés: **${(b.averageRating || 4.8).toFixed(1)} ★**\n`;
      if (b.description) {
        const clean = b.description.replace(/<[^>]+>/g, "").trim().slice(0, 160);
        answer += `   * _${clean}..._\n`;
      }
      answer += `\n`;
    }

    answer += `💡 *Tipp: Kattints bármelyik címre az online olvasás megnyitásához vagy a fájl letöltéséhez!*`;
    return answer;
  }

  // 5. Default Comprehensive Response
  let fallbackAnswer = `### 🏛️ Könyvtári Válasz a kérdésedre\n\n`;
  if (wikiContext?.wikiExtract) {
    fallbackAnswer += `${wikiContext.wikiExtract}\n\n`;
  }
  if (matchedBooks.length > 0) {
    fallbackAnswer += `A témához kapcsolódóan az alábbi könyveket találod meg a gyűjteményedben:\n\n`;
    for (const b of matchedBooks.slice(0, 4)) {
      fallbackAnswer += `* **[${b.title}](/book/${b.slug || b.id})** – ${b.authors.map((a) => a.name).join(", ")}\n`;
    }
  } else {
    fallbackAnswer += `A megadott témára a könyvtár keresőjében is érdemes rákeresned, vagy kérdezz bátran konkrét szerzőről, műfajról vagy olvasási sorrendről!`;
  }
  return fallbackAnswer;
}
