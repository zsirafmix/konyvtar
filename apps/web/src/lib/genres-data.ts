export interface GenreItem {
  slug: string;
  name: string;
  group: string;
  keywords: string[];
}

export interface GenreGroup {
  id: string;
  title: string;
  icon: string;
  genres: GenreItem[];
}

export const GENRE_GROUPS_DATA: Array<{
  id: string;
  title: string;
  icon: string;
  genres: Array<{ name: string; slug: string; keywords: string[] }>;
}> = [
  {
    id: "proza",
    title: "Próza & Szépirodalom",
    icon: "BookOpen",
    genres: [
      { name: "regény", slug: "regeny", keywords: ["regény", "kötet", "történet", "novel"] },
      { name: "novella", slug: "novella", keywords: ["novella", "novellás", "kispróza", "short story"] },
      { name: "elbeszélés", slug: "elbeszeles", keywords: ["elbeszélés", "elbeszélések", "narratíva"] },
      { name: "szépirodalom", slug: "szepirodalom", keywords: ["szépirodalom", "irodalom", "belles-lettres", "moricz", "jokai", "marai"] },
      { name: "klasszikus irodalom", slug: "klasszikus-irodalom", keywords: ["klasszikus", "világirodalom klasszikus", "tolstoy", "dostoevsky", "hugo"] },
      { name: "modern irodalom", slug: "modern-irodalom", keywords: ["modern", "posztmodern", "kortárs irodalom", "krasznahorkai", "esterhazy"] },
      { name: "mágikus realizmus", slug: "magikus-realizmus", keywords: ["mágikus realizmus", "marquez", "száz év magány", "borges"] },
      { name: "abszurd irodalom", slug: "abszurd-irodalom", keywords: ["abszurd", "kafka", "camus", "beckett", "ionesco"] },
      { name: "filozófiai regény", slug: "filozofiai-regeny", keywords: ["filozófiai regény", "camus", "sartre", "kundera", "mann"] },
      { name: "lélektani regény", slug: "lelektani-regeny", keywords: ["lélektani", "pszichológiai regény", "dosztojevszkij", "bun es bunhodhes"] },
      { name: "fejlődésregény", slug: "fejlodesregeny", keywords: ["fejlődésregény", "bildungsroman", "felnőtté válás"] },
      { name: "családregény", slug: "csaladregeny", keywords: ["családregény", "család saga", "mann", "buddenbrook"] },
      { name: "társadalmi regény", slug: "tarsadalmi-regeny", keywords: ["társadalmi", "körkép", "balzac", "zola"] },
      { name: "háborús regény", slug: "haborus-regeny", keywords: ["háborús", "világháború", "front", "remarque", "hemingway"] },
      { name: "levélregény", slug: "levelregeny", keywords: ["levélregény", "levelezés", "epistolary"] },
    ],
  },
  {
    id: "scifi",
    title: "Sci-Fi & Spekulatív Fikció",
    icon: "Rocket",
    genres: [
      { name: "sci-fi", slug: "sci-fi", keywords: ["sci-fi", "science fiction", "űrhajó", "galaxis", "asimov", "clarke", "dick"] },
      { name: "katonai sci-fi", slug: "katonai-sci-fi", keywords: ["katonai sci-fi", "military sci-fi", "űrcsata", "starship", "flotta"] },
      { name: "cyberpunk", slug: "cyberpunk", keywords: ["cyberpunk", "kiberpunk", "hacker", "gibson", "neuromancer", "matrix"] },
      { name: "steampunk", slug: "steampunk", keywords: ["steampunk", "gőzgép", "viktoriánus sci-fi", "fogaskerék"] },
      { name: "disztópia", slug: "disztopia", keywords: ["disztópia", "orwell", "1984", "huxley", "szép új világ", "elnyomás"] },
      { name: "utópia", slug: "utopia", keywords: ["utópia", "morustamás", "ideális társadalom"] },
      { name: "posztapokaliptikus regény", slug: "posztapokaliptikus-regeny", keywords: ["posztapokaliptikus", "apokalipszis", "világvége", "túlélés"] },
      { name: "alternatív történelmi regény", slug: "alternativ-tortenelmi-regeny", keywords: ["alternatív történelem", "uchronia", "ember a fellegvárban"] },
    ],
  },
  {
    id: "fantasy",
    title: "Fantasy & Mágia",
    icon: "Sparkles",
    genres: [
      { name: "fantasy", slug: "fantasy", keywords: ["fantasy", "tolkien", "varázslat", "sárkány", "mágia", "középfölde", "witcher"] },
      { name: "dark fantasy", slug: "dark-fantasy", keywords: ["dark fantasy", "sötét fantasy", "grimdark", "abercombie", "demon"] },
      { name: "urban fantasy", slug: "urban-fantasy", keywords: ["urban fantasy", "városi fantasy", "vámpír", "vérfarkas", "dresden"] },
      { name: "kalandfantasy", slug: "kalandfantasy", keywords: ["kalandfantasy", "hős fantasy", "kard és mágia"] },
      { name: "romantikus fantasy", slug: "romantikus-fantasy", keywords: ["romantikus fantasy", "romantasy", "tündér", "udvar"] },
      { name: "ifjúsági fantasy", slug: "ifjusagi-fantasy", keywords: ["ifjúsági fantasy", "harry potter", "percy jackson", "varázslóiskola"] },
    ],
  },
  {
    id: "krimi",
    title: "Krimi, Thriller & Bűnügy",
    icon: "Search",
    genres: [
      { name: "krimi", slug: "krimi", keywords: ["krimi", "gyilkosság", "nyomozó", "agatha christie", "poirot", "sherlock", "rendőrség"] },
      { name: "detektívregény", slug: "detektivregeny", keywords: ["detektív", "magánnyomozó", "doyle", "columbo", "bűntény"] },
      { name: "noir", slug: "noir", keywords: ["noir", "keménykalapos", "chandler", "hammett", "bűnös város"] },
      { name: "thriller", slug: "thriller", keywords: ["thriller", "feszültség", "hajsza", "összeesküvés", "leban"] },
      { name: "pszichothriller", slug: "pszichothriller", keywords: ["pszichothriller", "pszicho", "elmebeteg", "lélektani feszültség"] },
      { name: "romantikus thriller", slug: "romantikus-thriller", keywords: ["romantikus thriller", "veszélyes szerelem", "védelmező"] },
      { name: "jogi thriller", slug: "jogi-thriller", keywords: ["jogi thriller", "grisham", "tárgyalóterem", "ügyvéd"] },
      { name: "politikai thriller", slug: "politikai-thriller", keywords: ["politikai thriller", "kémregény", "le carre", "clancy", "ügynök"] },
      { name: "történelmi thriller", slug: "tortenelmi-thriller", keywords: ["történelmi thriller", "da vinci kód", "templomosok", "titkos társaság"] },
      { name: "horror", slug: "horror", keywords: ["horror", "king", "lovecraft", "szörny", "kísértet", "rettegés", "pokol"] },
      { name: "true crime", slug: "true-crime", keywords: ["true crime", "valós bűntények", "sorozatgyilkos", "tényfeltáró bűnügy"] },
    ],
  },
  {
    id: "kaland",
    title: "Kaland, Történelem & Mítosz",
    icon: "Compass",
    genres: [
      { name: "kalandregény", slug: "kalandregeny", keywords: ["kalandregény", "rejto", "verne", "dumas", "kincs", "sziget", "expedíció"] },
      { name: "történelmi regény", slug: "tortenelmi-regeny", keywords: ["történelmi regény", "gardonyi", "egri csillagok", "középkor", "róma", "háború"] },
      { name: "ifjúsági kalandregény", slug: "ifjusagi-kalandregeny", keywords: ["ifjúsági kaland", "kincses sziget", "tizenöt éves kapitány"] },
      { name: "krónika", slug: "kronika", keywords: ["krónika", "évkönyv", "gesta", "krónikás"] },
      { name: "mítosz", slug: "mitosz", keywords: ["mítosz", "mitológia", "görög mítosz", "istenek", "zeusz"] },
      { name: "legenda", slug: "legenda", keywords: ["legenda", "monda", "artúr király", "szentek"] },
      { name: "folklór", slug: "folklor", keywords: ["folklór", "néprajz", "hagyomány", "szokások"] },
      { name: "népmese", slug: "nepmese", keywords: ["népmese", "magyar népmese", "benedek elek", "aranyhajú"] },
      { name: "mondakötet", slug: "mondakotet", keywords: ["monda", "mondakötet", "rege", "hun monda"] },
    ],
  },
  {
    id: "szinmu",
    title: "Líra, Színmű & Humor",
    icon: "Smile",
    genres: [
      { name: "verses kötet", slug: "verses-kotet", keywords: ["verses kötet", "verseskötet", "szonett", "költemények"] },
      { name: "költészet", slug: "kolteszet", keywords: ["költészet", "líra", "petőfi", "ady", "józsef attila", "radnóti"] },
      { name: "dráma", slug: "drama", keywords: ["dráma", "színdarab", "madách", "ember tragédiája", "shakespeare"] },
      { name: "tragédia", slug: "tragedia", keywords: ["tragédia", "szophoklész", "hamlet", "tragikus"] },
      { name: "komédia", slug: "komedia", keywords: ["komédia", "vígjáték", "moliere", "vigjatek"] },
      { name: "színmű", slug: "szinmu", keywords: ["színmű", "felvonás", "színház", "dialog"] },
      { name: "szatíra", slug: "szatira", keywords: ["szatíra", "társadalomkritika", "swift", "gulliver"] },
      { name: "paródia", slug: "parodia", keywords: ["paródia", "karinthy", "így írtok ti", "gúnyrajz"] },
      { name: "humoros könyv", slug: "humoros-konyv", keywords: ["humor", "rejtő jenő", "wodehouse", "vicces", "kacagás"] },
      { name: "groteszk irodalom", slug: "groteszk-irodalom", keywords: ["groteszk", "örkény", "egyperces", "abszurd humor"] },
    ],
  },
  {
    id: "gyermek",
    title: "Gyermek & Ifjúsági Irodalom",
    icon: "Heart",
    genres: [
      { name: "mese", slug: "mese", keywords: ["mese", "mesék", "andersen", "grimm", "tündérmese"] },
      { name: "gyermekirodalom", slug: "gyermekirodalom", keywords: ["gyermekirodalom", "gyerekkönyv", "micimackó", "kis herceg"] },
      { name: "ifjúsági irodalom", slug: "ifjusagi-irodalom", keywords: ["ifjúsági", "pál utcai fiúk", "tüskevár", "kamasz", "young adult"] },
    ],
  },
  {
    id: "eletrajz",
    title: "Életrajz, Memoár & Tényirodalom",
    icon: "User",
    genres: [
      { name: "életrajz", slug: "eletrajz", keywords: ["életrajz", "biográfia", "életút", "pályakép"] },
      { name: "önéletrajz", slug: "oneletrajz", keywords: ["önéletrajz", "autobiográfia", "saját életem"] },
      { name: "memoár", slug: "memoar", keywords: ["memoár", "emlékirat", "visszaemlékezés"] },
      { name: "napló", slug: "naplo", keywords: ["napló", "naplóbejegyzés", "márai napló", "frank anna"] },
      { name: "útleírás", slug: "utleiras", keywords: ["útleírás", "útikönyv", "utazás", "expedíció leírása"] },
      { name: "riportkönyv", slug: "riportkonyv", keywords: ["riportkönyv", "tudósítás", "interjúkötet", "moldova"] },
      { name: "életrajzi regény", slug: "eletrajzi-regeny", keywords: ["életrajzi regény", "regényes életrajz", "irving stone"] },
      { name: "dokumentumregény", slug: "dokumentumregeny", keywords: ["dokumentumregény", "tényregény", "hidegvérrel"] },
      { name: "tényirodalom", slug: "tenyirodalom", keywords: ["tényirodalom", "non-fiction", "nonfiction", "valóság"] },
    ],
  },
  {
    id: "tudomany",
    title: "Tudomány, Szakkönyv & Ismeretterjesztés",
    icon: "GraduationCap",
    genres: [
      { name: "ismeretterjesztő könyv", slug: "ismeretterjeszto-konyv", keywords: ["ismeretterjesztő", "populáris tudomány", "sagan", "hawking", "harari"] },
      { name: "tudományos könyv", slug: "tudomanyos-konyv", keywords: ["tudományos", "kutatás", "elmélet", "akadémiai"] },
      { name: "tankönyv", slug: "tankonyv", keywords: ["tankönyv", "oktatási", "egyetemi tankönyv", "jegyzet"] },
      { name: "szakkönyv", slug: "szakkonyv", keywords: ["szakkönyv", "kézikönyv szakembereknek", "monográfia"] },
      { name: "esszékötet", slug: "esszekotet", keywords: ["esszé", "esszékötet", "értekezés", "tanulmánykötet"] },
      { name: "publicisztika", slug: "publicisztika", keywords: ["publicisztika", "cikkgyűjtemény", "hírlapírás"] },
      { name: "ismeretterjesztő fikció", slug: "ismeretterjeszto-fikcio", keywords: ["ismeretterjesztő fikció", "tudományos kaland", "tudománynépszerűsítő"] },
      { name: "kézikönyv", slug: "kezikonyv", keywords: ["kézikönyv", "útmutató", "kompendium", "manual"] },
      { name: "lexikon", slug: "lexikon", keywords: ["lexikon", "szócikkek", "magyar lexikon"] },
      { name: "enciklopédia", slug: "enciklopedia", keywords: ["enciklopédia", "összefoglaló nagylexikon"] },
      { name: "atlasz", slug: "atlasz", keywords: ["atlasz", "térkép", "földrajzi atlasz", "csillagatlasz"] },
      { name: "útmutató", slug: "utmutato", keywords: ["útmutató", "gyakorlati útmutató", "hogyan működik"] },
    ],
  },
  {
    id: "onismeret",
    title: "Önismeret, Filozófia & Lélektan",
    icon: "Cpu",
    genres: [
      { name: "filozófiai mű", slug: "filozofiai-mu", keywords: ["filozófia", "platón", "arisztotelész", "kant", "nietzsche", "bölcselet"] },
      { name: "vallási könyv", slug: "vallasi-konyv", keywords: ["vallás", "teológia", "biblia", "egyháztörténet", "kereszténység"] },
      { name: "spirituális könyv", slug: "spiritualis-konyv", keywords: ["spirituális", "ezotéria", "lélek", "tudatosság", "belső béke"] },
      { name: "önfejlesztő könyv", slug: "onfejleszto-konyv", keywords: ["önfejlesztés", "önfejlesztő", "szokások", "produktivitás"] },
      { name: "pszichológiai könyv", slug: "pszichologiai-konyv", keywords: ["pszichológia", "freud", "jung", "terápia", "érzelmek"] },
      { name: "motivációs könyv", slug: "motivacios-konyv", keywords: ["motiváció", "siker", "inspiráció", "célkitűzés"] },
    ],
  },
  {
    id: "uzlet",
    title: "Üzlet, Gazdaság, Politika & Jog",
    icon: "Briefcase",
    genres: [
      { name: "üzleti könyv", slug: "uzleti-konyv", keywords: ["üzlet", "business", "vállalkozás", "menedzsment", "marketing"] },
      { name: "gazdasági könyv", slug: "gazdasagi-konyv", keywords: ["gazdaság", "közgazdaságtan", "pénzügy", "makroökonómia"] },
      { name: "politikai könyv", slug: "politikai-konyv", keywords: ["politika", "társadalomelmélet", "geopolitika", "államtan"] },
      { name: "jogi könyv", slug: "jogi-konyv", keywords: ["jog", "törvény", "jogtudomány", "polgári jog", "büntetőjog"] },
    ],
  },
  {
    id: "vizualis",
    title: "Művészet, Vizuális, Romantika & Média",
    icon: "Palette",
    genres: [
      { name: "művészeti könyv", slug: "muveszeti-konyv", keywords: ["művészet", "festészet", "szobrászat", "építészet", "művészettörténet"] },
      { name: "fotóalbum", slug: "fotoalbum", keywords: ["fotóalbum", "fényképezés", "képeskönyv", "fotográfia"] },
      { name: "szakácskönyv", slug: "szakacskonyv", keywords: ["szakácskönyv", "recept", "gasztronómia", "főzés", "konyhaművészet"] },
      { name: "romantikus regény", slug: "romantikus-regeny", keywords: ["romantikus", "szerelem", "szenvedély", "daniellesteel", "nora roberts"] },
      { name: "erotikus irodalom", slug: "erotikus-irodalom", keywords: ["erotikus", "erotika", "szenvedélyes", "vonzalom"] },
      { name: "képregény", slug: "kepregeny", keywords: ["képregény", "comic", "képregénykötet", "marvel", "dc"] },
      { name: "manga", slug: "manga", keywords: ["manga", "japán képregény", "anime regény"] },
      { name: "grafikus regény", slug: "grafikus-regeny", keywords: ["grafikus regény", "graphic novel", "illusztrált regény"] },
      { name: "hangoskönyv", slug: "hangoskonyv", keywords: ["hangoskönyv", "audiobook", "felolvasás"] },
      { name: "interaktív könyv", slug: "interaktiv-konyv", keywords: ["interaktív", "lapozgatós könyv", "kaland-játék-kockázat"] },
    ],
  },
];

// Flatten all genres
export const ALL_103_GENRES: GenreItem[] = GENRE_GROUPS_DATA.flatMap((g) =>
  g.genres.map((item) => ({
    slug: item.slug,
    name: item.name,
    group: g.title,
    keywords: item.keywords,
  }))
);

export function getGenreBySlug(slug: string): GenreItem | undefined {
  const normSlug = slug.toLowerCase().trim();
  return ALL_103_GENRES.find((g) => g.slug === normSlug || g.name.toLowerCase() === normSlug);
}

export function normStr(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function matchGenreForText(textToScan: string): string {
  const clean = normStr(textToScan);
  for (const item of ALL_103_GENRES) {
    for (const kw of item.keywords) {
      if (clean.includes(normStr(kw))) {
        return item.name;
      }
    }
  }
  return "regény";
}
