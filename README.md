# Librarian AI – Intelligens Digitális Könyvtár és Közösségi Platform

> Modern, AI-alapú digitális könyvtárrendszer és közösségi platform, Calibre, Goodreads, Spotify, Apple Books és Letterboxd inspirációval.

---

## 1. Termék Vízió és Alapelvek

A Librarian AI több tízezer vagy százezer e-könyv (EPUB, PDF, MOBI, AZW3) intelligens rendszerezésére, szemantikus keresésére és közösségi felfedezésére tervezett production-ready rendszer.

Legfőbb alapelv: **STORAGE ≠ LIBRARY DATABASE**
* A felhőtároló (MEGA, helyi tároló, S3) a bináris fájlokat kezeli.
* Az alkalmazás relációs és vektoros adatbázisa (PostgreSQL + pgvector) tárolja a könyveket, szerzőket, sorozatokat, kiadásokat, metaadatokat, jogkezelési státuszokat, értékeléseket, listákat és olvasási állapotokat.
* **Minden felirat kizárólag magyar nyelvű.**
* **Sötét és világos mód** támogatása prémium, Spotify / Apple Books esztétikával.

---

## 2. Jogi Megfelelőség és Terjesztési Jogok (21 Napos Szabály)

A rendszerbe épített **jogosultság- és terjesztéskezelés** garantálja, hogy magánkönyvek soha ne válhassanak automatikusan nyilvánossá:
* `distribution_status` mezők minden kiadásnál és fájlnál:
  * `PRIVATE`: Kizárólag a feltöltő tulajdonos töltheti le.
  * `PUBLIC_DOMAIN`: Közkincs, mindenki számára azonnal letölthető.
  * `LICENSED` / `CREATOR_AUTHORIZED`: Jogszerűen terjeszthető közösségi tartalom.
  * `RESTRICTED`: Letöltés korlátozva.

### 21 Napos Szabály (Free vs. Supporting Member):
* **Supporting Member (1 EUR / hét önkéntes támogatás):**
  * Azonnali hozzáférés az összes újonnan bekerült jogszerű könyvhöz.
  * Magasabb AI és RAG használati limitek.
  * Támogatói jelvény (Supporting Member badge) a profilon.
* **Ingyenes Tag (Free Member):**
  * Teljes hozzáférés a saját privát könyvtárhoz, kereséshez, AI ajánlásokhoz és közösséghez.
  * Új terjeszthető könyveknél **21 napos várakozási idő** (`library_release_at + 21 nap`). A felületen pontos visszaszámláló látható: `INGYENES TAGOKNAK ELÉRHETŐ: X nap Y óra múlva`.
  * A 21 nap leteltével a könyv véglegesen ingyenesen letölthetővé válik (nincs zárt fizetős fal).

---

## 3. Rendszerarchitektúra és Monorepo Struktúra

```
librarian-ai/
├── apps/
│   └── web/                   # Next.js 14 (App Router) frontend & API routes
│       ├── src/app/           # Kezdőlap, Kereső, RAG, Könyvadatlap, Admin, Profil
│       └── src/components/    # BookCard 2:3, HorizontalShelf, Sidebar, Header
├── packages/
│   ├── database/              # Prisma ORM + PostgreSQL (pgvector), migráció és seed
│   ├── storage/               # StorageProvider absztrakció, MEGA és Helyi tároló
│   ├── ai/                    # 70/20/10 Ajánló, Fájlnév-parszoló, RAG, Duplikátumszűrő
│   ├── auth/                  # Scrypt jelszóhashelés, JWT és canUserDownload jogkezelő
│   └── jobs/                  # BullMQ / In-memory kötegelt háttérmunka (Scanner)
├── infrastructure/
│   ├── docker/                # Dockerfile.web
│   └── docker-compose.yml     # PostgreSQL pgvectorral, Redis, Next.js Web
├── .env.example
├── package.json
└── README.md
```

---

## 4. Telepítés és Indítás

### Előfeltételek
* Node.js v20+ vagy v24+
* Docker és Docker Compose

### 1. Repository klónozása és környezeti változók beállítása
```bash
cp .env.example .env
```

### 2. Adatbázis és Redis indítása Dockerrel
```bash
cd infrastructure
docker compose up -d postgres redis
cd ..
```

### 3. Függőségek telepítése és Adatbázis inicializálása
```bash
npm install
npm run db:push
npm run db:seed
```
*A seed script 32+ mesterművel (Alapítvány, Dűne, Neurománc, 2001 Űrodisszeia, Hídtervezés, 1984), 10 tesztfelhasználóval, értékelésekkel, könyvklubokkal és listákkal azonnal feltölti az adatbázist.*

### 4. Fejlesztői szerver indítása
```bash
npm run dev
```
Nyisd meg a böngészőben: [http://localhost:3000](http://localhost:3000)

---

## 5. Főbb Funkciók és Képernyők

### Kezdőlap (`/`)
* **A Nap Kiemelt Ajánlata (Today's Pick):** AI által kiválasztott kötet magyar nyelvű indoklással ("Azért ajánljuk, mert...").
* **Dinamikus Polcok:** "Neked ajánljuk" (70-20-10 hibrid ajánló), "Olvasás folytatása", "Újdonságok a könyvtárban", "Népszerű a közösségben", "Mivel tetszett az Alapítvány és a Dűne...", "Gyors olvasmányok".
* **2:3 Képarányú borítók:** Spotify/Letterboxd stílusú lebegő gyorsműveletekkel (kedvencek, olvasási státusz).

### Kereső (`/search`)
* **Három szintű keresés:**
  1. Hagyományos kulcsszó keresés (cím, szerző, ISBN, kiadó, sorozat, címkék).
  2. Teljes szöveges keresés (FTS).
  3. **Szemantikus AI keresés:** Természetes nyelvű kérdések alapján (pl. *„80-as évekbeli sci-fi idegen civilizációkról”*, *„könyvek mesterséges intelligenciáról kevés matematikával”*).
* Eredményfülek: Mind, Könyvek, Szerzők, Sorozatok, Listák, Felhasználók.

### Kérdezz a könyvtáradtól (`/ask-library`)
* Dedikált RAG felület.
* Kizárólag a hozzáférhető gyűjteményre támaszkodik, hallucinációk nélkül.
* Kattintható könyvkártya-hivatkozások a válaszban.

### Könyvadatlap (`/book/[slug]`)
* Nagy felbontású borító, teljes bibliográfiai adatok, AI összefoglaló, interaktív 1–5 csillagos értékelés, saját privát jegyzet.
* **Letöltési szekció:**
  * Free felhasználóknál új könyvnél: 21 napos visszaszámláló kártya és felhívás az önkéntes támogatásra.
  * Támogatóknál és 21 napot meghaladó könyveknél: Biztonságos letöltési kapcsolat (`GET /api/download/:fileId`) auditált IP hasheléssel.

### Közösség (`/community`)
* Élő aktivitási hírfolyam ("Anna 5 csillagra értékelte az Alapítványt", stb.).
* **Ízlés-egyezés (Taste Match):** 0–100% egyezési mutató az olvasási szokások és kedvencek matematikai átfedése alapján.

### Adminisztráció (`/admin`)
* **Metrikák:** Indexelt könyvek száma, aktív támogatók, AI pontosság.
* **AI Metaadat Felülvizsgálati Sor (Review Queue):** Alacsony konfidenciájú tételek jóváhagyása, szerkesztése vagy elutasítása.
* **Terjesztési Jogok (Rights):** Jogstátuszok és licencek kezelése.
* **Import & Queue:** 50 000+ könyv kötegelt feldolgozásának élő állapota (`36,829 / 52,131 feldolgozva`).

---

## 6. Automatizált Tesztek Futtatása

```bash
npm run test --workspace=@librarian/auth
npm run test --workspace=@librarian/ai
```

A tesztcsomag ellenőrzi:
1. **FREE + új könyv (< 21 nap):** Hozzáférés megtagadva, visszaszámláló aktív.
2. **FREE + 21 nap letelt:** Hozzáférés engedélyezve.
3. **SUPPORTER + új könyv:** Hozzáférés azonnal engedélyezve.
4. **PRIVATE FILE + idegen felhasználó:** Hozzáférés szigorúan megtagadva.
5. **PRIVATE FILE + tulajdonos:** Hozzáférés engedélyezve.
6. Zajcsökkentő fájlnév-parszolás és konfidenciaszámítás.
7. Többszintű duplikátumszűrés (SHA-256, ISBN, heurisztika).
8. Vektoros koszinusz hasonlóság és ízlés-egyezés kalkuláció.

---

## 7. Licenc
MIT License. Fejlesztve a modern, nyílt digitális olvasáskultúra támogatására.
