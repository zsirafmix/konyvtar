import { BookItem } from "@librarian/ai";
import { fetchMolyMetadata } from "./book-metadata-lookup";

export interface AIKnowledgeContext {
  wikiTitle?: string;
  wikiExtract?: string;
  wikiUrl?: string;
  googleDescription?: string;
  googleCategories?: string[];
  googlePublishedYear?: number;
  authorBio?: string;
  molyTitle?: string;
  molyAuthor?: string;
  molyDescription?: string;
  molyRating?: number;
  molyTags?: string[];
}

/**
 * Fetch knowledge from Moly.hu
 */
export async function fetchMolyLibrarianContext(query: string): Promise<AIKnowledgeContext | null> {
  try {
    const cleanQuery = query
      .replace(/[?!,.]/g, "")
      .replace(/\b(könyv|regény|sorrend|sorrendben|olvassam|miről szól|ki az a|kicsoda|ajánlj|ajánlanál)\b/gi, "")
      .trim();

    if (!cleanQuery) return null;

    const moly = await fetchMolyMetadata(cleanQuery);
    if (!moly) return null;

    return {
      molyTitle: moly.title,
      molyAuthor: moly.author,
      molyDescription: moly.description,
      molyRating: moly.rating,
      molyTags: moly.genre ? [moly.genre] : [],
    };
  } catch {
    return null;
  }
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

    // 1. Search via Wikipedia search API
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
  } catch {
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
  } catch {
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
          generationConfig: { temperature: 0.4, maxOutputTokens: 1200 },
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
          max_tokens: 1200,
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
          max_tokens: 1200,
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
      "Kiegészítő előzménykötetek: Előjáték az Alapítványhoz, Előre az Alapítványhoz",
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
    advice: "A hobbit elolvasása után A Gyűrűk Ura trilógia a fő mű; A szilmarilokat csak a trilógia után érdemes kézbe venni.",
  },
  rejto: {
    name: "Rejtő Jenő (P. Howard) légiós és humoros regényei",
    author: "Rejtő Jenő",
    recommendedOrder: [
      "1. A tizennégy karátos autó (Gorcsev Iván és a Nobel-díj kezdete)",
      "2. A három testőr Afrikában (Csülök, Senki Alfonz és Tuskó Hopkins)",
      "3. Piszkos Fred, a kapitány (A Csendes-óceán réme és Fülig Jimmy)",
      "4. Piszkos Fred közbelép (Fülig Jimmy őszinte sajnálatára)",
      "5. Az elveszett cirkáló",
      "6. Az előretolt helyőrség (Galamb és Troppauer Hümér)",
      "7. A láthatatlan légió",
      "8. Vesztegzár a Grand Hotelben (Felix van der Goude és a bubópestis-komédia)",
    ],
    advice: "Rejtő regényei önmagukban is kiválóak, de a Piszkos Fred és a három jómadár kalandjait a fenti sorrendben a legszórakoztatóbb élvezni.",
  },
  lem: {
    name: "Stanisław Lem filozofikus sci-fi művei",
    author: "Stanisław Lem",
    recommendedOrder: [
      "1. Solaris (1961) – Az élő, gondolkodó óceán és az emberi megismerés határai",
      "2. Kiberiáda (Trurl és Klapanciusz konstruktőrök gépmeséi)",
      "3. Csillagnapló (Ijon Tichy űrutazó abszurd és mélyenszántó kalandjai)",
      "4. Az Úr hangja (A földönkívüli üzenet megfejtésének dilemmája)",
      "5. Éden (Kényszerleszállás és a megérthetetlen civilizáció)",
      "6. A Legyőzhetetlen (A mikromechanikus rovarrajok evolúciója)",
    ],
    advice: "Kezdésnek a Solaris adja a legmélyebb filozófiai élményt, míg a humorosabb oldalért a Kiberiáda a legjobb belépő.",
  },
  szerbantal: {
    name: "Szerb Antal mesterművei",
    author: "Szerb Antal",
    recommendedOrder: [
      "1. Utas és holdvilág (1937) – Mihály toszkán utazása, a nosztalgia és a kamaszkor feloldhatatlan mítosza",
      "2. A Pendragon legenda (1934) – Filozofikus krimi, rózsakeresztes misztika Walesben",
      "3. A királyné nyaklánca – A francia forradalom előestéjének sziporkázó története",
      "4. A világirodalom története / A magyar irodalom története – Esszéírói remekművek",
    ],
    advice: "Az Utas és holdvilág a magyar irodalom egyik legmegindítóbb és legszebb regénye; mindenkinek kötelező legalább egyszer átélni!",
  },
  marai: {
    name: "Márai Sándor életműve",
    author: "Márai Sándor",
    recommendedOrder: [
      "1. A gyertyák csonkig égnek (1942) – Henrik tábornok és Konrád éjszakai szembesülése",
      "2. Egy polgár vallomásai (1934) – A polgári ethosz monumentális önéletrajza",
      "3. Eszter hagyatéka (1939) – A megbocsátás és a sorsfordító szerelem lélektana",
      "4. San Gennaro vére / Naplók – A száműzetés megrázó dokumentumai",
    ],
    advice: "Kezdésnek A gyertyák csonkig égnek ajánlott, amely a barátság, hűség és árulás legmélyebb kérdéseit feszegeti.",
  },
  king: {
    name: "Stephen King legkiemelkedőbb művei",
    author: "Stephen King",
    recommendedOrder: [
      "1. A ragyogás (The Shining) – Jack Torrance és a Panoráma Hotel",
      "2. Végítélet (The Stand) – A szuperinfluenza utáni monumentális túlélés",
      "3. 11/22/63 – Időutazás a Kennedy-gyilkosság megakadályozására",
      "4. Az (It) – Derry városa és a gyermekkori félelmek leküzdése",
      "5. A Setét Torony (The Dark Tower) 1-7. kötet – King magnum opusa",
    ],
    advice: "A pszichológiai mélységért a Ragyogás vagy a 11/22/63 a legjobb indulás King sokszínű világában.",
  },
};

/**
 * Intelligent Hungarian AI Librarian synthesizer grounded in Moly.hu, MEK/OSZK, and Wikipedia HU
 */
export function synthesizeHungarianLibrarianAnswer(
  query: string,
  matchedBooks: BookItem[],
  wikiContext: AIKnowledgeContext | null,
  googleContext: AIKnowledgeContext | null,
  molyContext?: AIKnowledgeContext | null
): string {
  const norm = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 1. Reading Order Query
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
      (key === "szerbantal" && (norm.includes("szerb") || norm.includes("utas es holdvilag") || norm.includes("pendragon"))) ||
      (key === "marai" && (norm.includes("marai") || norm.includes("gyertyak"))) ||
      (key === "king" && (norm.includes("stephen king") || norm.includes("ragyogas") || norm.includes("setet torony")))
    ) {
      if (
        norm.includes("sorrend") ||
        norm.includes("hogyan") ||
        norm.includes("melyik") ||
        norm.includes("kezd") ||
        norm.includes("olvassam") ||
        norm.includes("kötet")
      ) {
        let answer = `### 📚 ${series.name} – Ajánlott olvasási kalauz és sorrend\n\n`;
        answer += `**Szerző:** ${series.author}\n\n`;

        if (molyContext?.molyRating) {
          answer += `> 🌟 **Moly.hu olvasói értékelés:** ${molyContext.molyRating} ★ (nagyon magas olvasottság és elismertség)\n\n`;
        }

        answer += `A sorozat köteteit a következő logikai és kanonikus sorrendben érdemes olvasni a legteljesebb irodalmi élményért:\n\n`;
        for (const item of series.recommendedOrder) {
          answer += `* ${item}\n`;
        }
        answer += `\n> 💡 **A Könyvtáros tanácsa:** ${series.advice}\n\n`;

        if (matchedBooks.length > 0) {
          answer += `#### 📖 A könyvtáradban azonnal elérhető kötetek ebből a ciklusból:\n`;
          for (const b of matchedBooks.slice(0, 6)) {
            const y = b.publishedYear ? ` (${b.publishedYear})` : "";
            answer += `* **[${b.title}](/book/${b.slug || b.id})** – ${b.authors.map((a) => a.name).join(", ")}${y} • *[Olvasás](/read/${b.slug || b.id})*\n`;
          }
        }
        return answer;
      }
    }
  }

  // 2. Author Inquiry (e.g. "Kicsoda Szerb Antal?", "Mesélj Asimovról")
  const isAuthorQuery =
    norm.includes("kicsoda") ||
    norm.includes("ki az a") ||
    norm.includes("ki volt") ||
    norm.includes("mesélj") ||
    norm.includes("életrajz") ||
    norm.includes("szerző");

  if (isAuthorQuery && (wikiContext?.wikiExtract || molyContext?.molyAuthor || matchedBooks.length > 0)) {
    const authorName =
      molyContext?.molyAuthor ||
      wikiContext?.wikiTitle ||
      matchedBooks[0]?.authors[0]?.name ||
      "Keresett Szerző";

    let answer = `### ✍️ Szerzői Portré: ${authorName}\n\n`;

    if (wikiContext?.wikiExtract) {
      answer += `${wikiContext.wikiExtract}\n\n`;
    } else if (molyContext?.molyDescription) {
      answer += `${molyContext.molyDescription}\n\n`;
    }

    if (molyContext?.molyRating) {
      answer += `> 🌟 **Közönségkedvenc:** A Moly.hu magyar olvasói közösségében kiemelkedő, **${molyContext.molyRating} ★** átlagos értékeléssel büszkélkedhet.\n\n`;
    }

    if (matchedBooks.length > 0) {
      answer += `#### 📚 A könyvtáradban közvetlenül elérhető kötetei:\n`;
      for (const b of matchedBooks.slice(0, 6)) {
        const rating = b.averageRating ? ` ★ ${b.averageRating.toFixed(1)}` : "";
        answer += `* **[${b.title}](/book/${b.slug || b.id})**${b.publishedYear ? ` (${b.publishedYear})` : ""}${rating} – *${b.categories[0]?.name || "Kötet"}* • [📖 Azonnali Olvasás](/read/${b.slug || b.id})\n`;
        if (b.description) {
          const shortDesc = b.description.slice(0, 150).replace(/<[^>]+>/g, "").trim();
          answer += `  _${shortDesc}..._\n`;
        }
      }
      answer += `\n*Kattints bármelyik kötetre a digitális olvasó megnyitásához vagy a fájl letöltéséhez!*`;
    }
    return answer;
  }

  // 3. Book Synopsis / Plot Inquiry
  const isPlotQuery =
    norm.includes("miről szól") ||
    norm.includes("tartalom") ||
    norm.includes("cselekmény") ||
    norm.includes("történet") ||
    norm.includes("ismertető") ||
    norm.includes("összefoglaló") ||
    norm.includes("lényeg");

  if (isPlotQuery || molyContext?.molyDescription) {
    const bookTitle =
      molyContext?.molyTitle ||
      wikiContext?.wikiTitle ||
      matchedBooks[0]?.title ||
      "A keresett mű";

    let answer = `### 📖 Ismertető és Cselekmény: ${bookTitle}\n\n`;

    if (molyContext?.molyDescription) {
      answer += `> **Moly.hu hivatalos fülszöveg:**\n>\n> ${molyContext.molyDescription.replace(/\n/g, "\n> ")}\n\n`;
    } else if (wikiContext?.wikiExtract) {
      answer += `${wikiContext.wikiExtract}\n\n`;
    } else if (googleContext?.googleDescription) {
      answer += `${googleContext.googleDescription.slice(0, 600).replace(/<[^>]+>/g, "")}...\n\n`;
    }

    if (molyContext?.molyRating) {
      answer += `⭐ **Olvasói értékelés:** ${molyContext.molyRating} / 5.0 a magyar olvasók körében.\n\n`;
    }

    if (matchedBooks.length > 0) {
      const top = matchedBooks[0];
      answer += `#### 📥 Olvasd el azonnal a könyvtáradban:\n`;
      answer += `* **[${top.title}](/book/${top.slug || top.id})** – Szerző: **${top.authors.map((a) => a.name).join(", ")}**`;
      if (top.publishedYear) answer += ` (${top.publishedYear})`;
      answer += `\n\n👉 **[Kattints ide az online olvasó megnyitásához!](/read/${top.slug || top.id})**`;
    }
    return answer;
  }

  // 4. Recommendation / "Mit olvassak?" Inquiry
  let answer = `### 🏛️ Könyvtáros Ajánló és Szakvélemény\n\n`;

  if (wikiContext?.wikiExtract) {
    answer += `> _"${wikiContext.wikiExtract.slice(0, 220)}..."_\n\n`;
  }

  if (molyContext?.molyDescription) {
    answer += `> 📖 **Fülszöveg:** ${molyContext.molyDescription.slice(0, 250)}...\n\n`;
  }

  answer += `A digitális gyűjtemény 11 472 kötete közül az alábbi kiemelkedő, minőségi műveket ajánlom neked:\n\n`;

  for (let i = 0; i < Math.min(matchedBooks.length, 5); i++) {
    const b = matchedBooks[i];
    const authorStr = b.authors.map((a) => a.name).join(", ") || "Klasszikus szerző";
    const genreStr = b.categories[0]?.name || "Olvasmány";
    answer += `**${i + 1}. [${b.title}](/book/${b.slug || b.id})** – ${authorStr}${b.publishedYear ? ` (${b.publishedYear})` : ""}\n`;
    answer += `   * Műfaj: **${genreStr}** • Értékelés: **${(b.averageRating || 4.8).toFixed(1)} ★**\n`;
    if (b.description) {
      const clean = b.description.replace(/<[^>]+>/g, "").trim().slice(0, 160);
      answer += `   * _${clean}..._\n`;
    }
    answer += `   * [📖 Olvasás indítása](/read/${b.slug || b.id})\n\n`;
  }

  answer += `💡 *Tipp: Kattints a címekre vagy az „Olvasás indítása” gombra a könyv azonnali böngészéséhez!*`;
  return answer;
}
