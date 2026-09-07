import { PrismaClient } from "@prisma/client";
import { scryptSync, randomBytes } from "node:crypto";
import { SEED_USERS, SEED_BOOKS } from "./seed-data";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
  console.log("🌱 Starting Librarian AI database seeding...");

  const existingUsers = await prisma.user.count();
  if (existingUsers > 0 && process.env.FORCE_SEED !== "true") {
    console.log(`ℹ️ Az adatbázis már tartalmaz adatokat (${existingUsers} felhasználó). A seeder átugrásra került az adatok megőrzése érdekében.`);
    return;
  }

  // 1. Clean existing records in reverse dependency order
  console.log("🧹 Clearing old seed data...");
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.metadataSuggestion.deleteMany({});
  await prisma.importItem.deleteMany({});
  await prisma.importJob.deleteMany({});
  await prisma.downloadLog.deleteMany({});
  await prisma.embedding.deleteMany({});
  await prisma.recommendation.deleteMany({});
  await prisma.discussionComment.deleteMany({});
  await prisma.discussion.deleteMany({});
  await prisma.bookClubMember.deleteMany({});
  await prisma.bookClub.deleteMany({});
  await prisma.bookListItem.deleteMany({});
  await prisma.bookList.deleteMany({});
  await prisma.userFollow.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.userBookNote.deleteMany({});
  await prisma.reviewComment.deleteMany({});
  await prisma.reviewLike.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.rating.deleteMany({});
  await prisma.readingStatus.deleteMany({});
  await prisma.cover.deleteMany({});
  await prisma.fileAsset.deleteMany({});
  await prisma.bookTag.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.bookCategory.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.bookSeries.deleteMany({});
  await prisma.series.deleteMany({});
  await prisma.bookAuthor.deleteMany({});
  await prisma.author.deleteMany({});
  await prisma.bookEdition.deleteMany({});
  await prisma.book.deleteMany({});
  await prisma.publisher.deleteMany({});
  await prisma.storageProvider.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.userProfile.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Setup Storage Providers
  console.log("📦 Creating Storage Providers (MEGA & Local)...");
  const localProvider = await prisma.storageProvider.create({
    data: {
      name: "local",
      isActive: true,
      settings: { path: "./storage_data" },
    },
  });

  const megaProvider = await prisma.storageProvider.create({
    data: {
      name: "mega",
      isActive: true,
      settings: { email: "user@example.com" },
    },
  });

  // 3. Seed Users & Profiles
  console.log("👥 Creating 10 test users with profiles and memberships...");
  const createdUsers: Record<string, string> = {};

  for (const u of SEED_USERS) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash: hashPassword(u.password),
        role: u.role,
        profile: {
          create: {
            displayName: u.displayName,
            bio: u.bio,
            avatarUrl: u.avatarUrl,
            favoriteGenres: u.favoriteGenres,
            isSupporterBadgeVisible: true,
            isProfilePublic: true,
            isLibraryPublic: true,
          },
        },
        memberships: {
          create: {
            status: u.membership,
            startedAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
            expiresAt: u.membership === "SUPPORTER" ? new Date(Date.now() + 180 * 24 * 3600 * 1000) : null,
            provider: "stripe",
            providerSubscriptionId: u.membership === "SUPPORTER" ? "sub_mock_active" : null,
          },
        },
      },
    });
    createdUsers[u.email] = user.id;
  }

  // 4. Seed Categories and Tags
  console.log("🏷️ Creating hierarchical categories & tags...");
  const categoryCache: Record<string, string> = {};
  const tagCache: Record<string, string> = {};

  for (const b of SEED_BOOKS) {
    for (const c of b.categories) {
      if (!categoryCache[c]) {
        const slug = c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "-");
        const cat = await prisma.category.upsert({
          where: { slug },
          update: {},
          create: {
            name: c,
            slug,
            description: `${c} kategória könyvei`,
          },
        });
        categoryCache[c] = cat.id;
      }
    }
    for (const t of b.tags) {
      if (!tagCache[t]) {
        const tag = await prisma.tag.upsert({
          where: { name: t },
          update: {},
          create: { name: t },
        });
        tagCache[t] = tag.id;
      }
    }
  }

  // 5. Seed Books, Editions, Authors, Series, Covers, Files
  console.log("📚 Seeding 50 books with full metadata, series, and legal rights...");
  const createdBookIds: string[] = [];

  for (const b of SEED_BOOKS) {
    // Publisher
    const publisher = await prisma.publisher.upsert({
      where: { name: b.publisher },
      update: {},
      create: { name: b.publisher },
    });

    // Create Book
    const book = await prisma.book.create({
      data: {
        title: b.title,
        originalTitle: b.originalTitle,
        slug: b.slug,
        description: b.description,
        aiSummary: b.aiSummary,
        language: b.language,
        averageRating: b.averageRating,
        ratingsCount: b.ratingsCount,
      },
    });
    createdBookIds.push(book.id);

    // Authors
    for (let i = 0; i < b.authors.length; i++) {
      const authorName = b.authors[i];
      const author = await prisma.author.upsert({
        where: { name: authorName },
        update: {},
        create: { name: authorName },
      });
      await prisma.bookAuthor.create({
        data: {
          bookId: book.id,
          authorId: author.id,
          order: i,
        },
      });
    }

    // Series
    if (b.series) {
      const series = await prisma.series.upsert({
        where: { name: b.series.name },
        update: {},
        create: { name: b.series.name, description: `${b.series.name} regényfolyam` },
      });
      await prisma.bookSeries.create({
        data: {
          bookId: book.id,
          seriesId: series.id,
          position: b.series.position,
        },
      });
    }

    // Categories
    for (const c of b.categories) {
      await prisma.bookCategory.create({
        data: {
          bookId: book.id,
          categoryId: categoryCache[c],
        },
      });
    }

    // Tags
    for (const t of b.tags) {
      await prisma.bookTag.create({
        data: {
          bookId: book.id,
          tagId: tagCache[t],
        },
      });
    }

    // Calculate release date
    const releaseDate = new Date(Date.now() - b.libraryReleaseDaysAgo * 24 * 3600 * 1000);
    const ownerUserId = b.distributionStatus === "PRIVATE" ? createdUsers["olvaso@librarian.ai"] : null;

    // Edition
    const edition = await prisma.bookEdition.create({
      data: {
        bookId: book.id,
        publisherId: publisher.id,
        publishedYear: b.publishedYear,
        isbn13: b.isbn13,
        pages: b.pages,
        format: b.fileFormats[0]?.format || "EPUB",
        distributionStatus: b.distributionStatus,
        libraryReleaseAt: releaseDate,
        rightsSource: b.distributionStatus === "PUBLIC_DOMAIN" ? "Project Gutenberg / Public Domain" : "Licencelt digitális kiadás",
        rightsLicense: b.distributionStatus === "PUBLIC_DOMAIN" ? "Közkincs (Public Domain)" : "Standard Digitális Könyvtári Licenc",
        ownerUserId,
      },
    });

    // Primary Cover
    await prisma.cover.create({
      data: {
        editionId: edition.id,
        coverUrl: b.coverUrl,
        coverSource: "openlibrary",
        coverConfidence: 0.98,
        isPrimary: true,
      },
    });

    // File Assets
    for (const f of b.fileFormats) {
      const isMega = Math.random() > 0.4;
      await prisma.fileAsset.create({
        data: {
          editionId: edition.id,
          storageProviderId: isMega ? megaProvider.id : localProvider.id,
          fileKey: `${isMega ? "mega" : "local"}:${b.slug}.${f.format.toLowerCase()}`,
          fileName: `${b.title}.${f.format.toLowerCase()}`,
          fileSizeBytes: BigInt(f.sizeBytes),
          mimeType: f.format === "EPUB" ? "application/epub+zip" : "application/pdf",
          sha256Hash: `hash_${b.slug}_${f.format}_${f.sizeBytes}`,
          qualityScore: f.quality,
          distributionStatus: b.distributionStatus,
        },
      });
    }
  }

  // 6. User Activity: Reading Statuses, Reviews, Favorites
  console.log("⭐ Adding reading statuses, reviews, and favorites...");
  const adminId = createdUsers["admin@librarian.ai"];
  const supporterId = createdUsers["supporter@librarian.ai"];
  const olvasoId = createdUsers["olvaso@librarian.ai"];
  const zsofiId = createdUsers["zsofi@librarian.ai"];

  // Admin finished Foundation & Dune
  await prisma.readingStatus.createMany({
    data: [
      { userId: adminId, bookId: createdBookIds[0], status: "COMPLETED", progressPercent: 100 },
      { userId: adminId, bookId: createdBookIds[5], status: "COMPLETED", progressPercent: 100 },
      { userId: supporterId, bookId: createdBookIds[0], status: "READING", progressPercent: 65 },
      { userId: supporterId, bookId: createdBookIds[9], status: "COMPLETED", progressPercent: 100 },
      { userId: olvasoId, bookId: createdBookIds[0], status: "COMPLETED", progressPercent: 100 },
      { userId: olvasoId, bookId: createdBookIds[17], status: "WANT_TO_READ", progressPercent: 0 },
      { userId: zsofiId, bookId: createdBookIds[25], status: "READING", progressPercent: 42 },
    ],
  });

  // Reviews
  const rev1 = await prisma.review.create({
    data: {
      userId: adminId,
      bookId: createdBookIds[0],
      rating: 5,
      text: "Minden idők egyik legfontosabb sci-fi regénye. A pszichohistória gondolata és Hari Seldon zsenialitása máig lenyűgöző.",
      spoiler: false,
      likeCount: 14,
    },
  });

  await prisma.reviewLike.create({
    data: {
      userId: supporterId,
      reviewId: rev1.id,
    },
  });

  const rev2 = await prisma.review.create({
    data: {
      userId: supporterId,
      bookId: createdBookIds[5],
      rating: 5,
      text: "A Dűne nem csupán egy sci-fi, hanem egy politikai, vallási és ökológiai tanulmány. Kötelező alapmű!",
      spoiler: false,
      likeCount: 9,
    },
  });

  // 7. Curated Book Lists
  console.log("📑 Creating curated public book lists...");
  const list1 = await prisma.bookList.create({
    data: {
      userId: adminId,
      title: "Alapvető Hard Sci-Fi Mesterművek",
      description: "A tudományos fantasztikum legátgondoltabb és legnagyobb hatású regényei egy helyen.",
      visibility: "PUBLIC",
      likeCount: 28,
      items: {
        create: [
          { bookId: createdBookIds[0], position: 1, note: "Az Alapítvány indította el a modern sci-fi aranykorát." },
          { bookId: createdBookIds[5], position: 2, note: "Páratlan ökológiai és politikai világépítés." },
          { bookId: createdBookIds[9], position: 3, note: "A kiberpunk szentírása." },
          { bookId: createdBookIds[12], position: 4, note: "A kozmikus léptékű tudományos precizitás." },
        ],
      },
    },
  });

  // 8. Book Clubs
  console.log("🏛️ Creating Book Clubs and discussions...");
  const club = await prisma.bookClub.create({
    data: {
      ownerId: createdUsers["moderator@librarian.ai"],
      name: "Sci-Fi és Filozófia Könyvklub",
      description: "Havi közös olvasások, mélyreható elemzések és viták a sci-fi aranykorától a kortárs remekművekig.",
      currentBookId: createdBookIds[0],
      members: {
        create: [
          { userId: createdUsers["moderator@librarian.ai"], role: "owner" },
          { userId: supporterId, role: "member" },
          { userId: olvasoId, role: "member" },
        ],
      },
      discussions: {
        create: {
          userId: createdUsers["moderator@librarian.ai"],
          title: "Valóban elkerülhetetlen a Birodalom bukása? – Vita az 1. fejezetről",
          content: "Hari Seldon szerint a szociális entrópia törvényszerűen bekövetkezik. Szerintetek a technológiai fejlődés lassíthatta volna ezt?",
          comments: {
            create: [
              {
                userId: supporterId,
                content: "Seldon modellje szerint nem a technológia, hanem az emberi psziché merevsége okozza az összeomlást.",
              },
            ],
          },
        },
      },
    },
  });

  // 9. Follows
  await prisma.userFollow.createMany({
    data: [
      { followerId: supporterId, followingId: adminId },
      { followerId: olvasoId, followingId: adminId },
      { followerId: olvasoId, followingId: supporterId },
    ],
  });

  console.log("✅ Database seeding completed successfully!");
  console.log(`✨ Created: ${SEED_BOOKS.length} books, ${SEED_USERS.length} users, 2 storage providers, ratings, reviews, lists, and clubs.`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
