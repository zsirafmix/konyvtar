import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@librarian/database";
import { canUserDownload, UserContext } from "@librarian/auth";
import { FALLBACK_BOOKS } from "@/lib/fallback-books";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Retrieve active user from query, header, or default to standard user
    const userRole = (req.headers.get("x-user-role") || "USER") as any;
    const membership = (req.headers.get("x-user-membership") || "FREE") as any;
    const userId = req.headers.get("x-user-id") || "demo_user_id";

    const currentUser: UserContext = {
      id: userId,
      role: userRole,
      membershipStatus: membership,
    };

    let book: any = null;
    try {
      book = await prisma.book.findFirst({
        where: {
          OR: [{ id }, { slug: id }],
        },
        include: {
          authors: {
            include: { author: true },
            orderBy: { order: "asc" },
          },
          series: {
            include: { series: true },
          },
          categories: {
            include: { category: true },
          },
          tags: {
            include: { tag: true },
          },
          reviews: {
            include: {
              user: {
                include: { profile: true },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          editions: {
            include: {
              publisher: true,
              covers: true,
              files: true,
            },
          },
        },
      });
    } catch (dbErr: any) {
      console.warn("DB hiba a könyvadatlap lekérésekor:", dbErr.message);
    }

    if (!book) {
      const fb = FALLBACK_BOOKS.find((b) => b.id === id || b.slug === id);
      if (fb) {
        return NextResponse.json({
          id: fb.id,
          slug: fb.slug,
          title: fb.title,
          originalTitle: null,
          description: fb.description,
          aiSummary: fb.description,
          language: "hu",
          averageRating: fb.averageRating,
          ratingsCount: fb.ratingsCount,
          authors: fb.authors.map((a, idx) => ({ id: `auth_${idx}`, name: a.name })),
          series: fb.seriesName ? { id: "s1", name: fb.seriesName, position: fb.seriesPosition || 1 } : null,
          categories: fb.categories.map((c, idx) => ({ id: `c_${idx}`, name: c.name, slug: c.name.toLowerCase() })),
          tags: fb.tags.map((t, idx) => ({ id: `t_${idx}`, name: t.name })),
          edition: {
            id: `ed_${fb.id}`,
            publisher: "Digitális Könyvtári Kiadás",
            publishedYear: fb.publishedYear || 2020,
            isbn10: null,
            isbn13: null,
            pages: fb.pages || 300,
            distributionStatus: fb.distributionStatus || "PUBLIC_DOMAIN",
            libraryReleaseAt: fb.libraryReleaseAt,
            rightsSource: "MEGA Felhőtárhely Nyílt Könyvtár",
            rightsLicense: "Közkincs (Public Domain)",
          },
          coverUrl: fb.coverUrl,
          files: [
            {
              id: `file_${fb.id}_epub`,
              fileName: `${fb.title}.epub`,
              fileSizeBytes: 1450000,
              mimeType: "application/epub+zip",
              qualityScore: 1.0,
              format: "EPUB",
              entitlement: { allowed: true, reason: "A könyv szabadon letölthető.", isPrivate: false },
            },
            {
              id: `file_${fb.id}_pdf`,
              fileName: `${fb.title}.pdf`,
              fileSizeBytes: 2850000,
              mimeType: "application/pdf",
              qualityScore: 0.95,
              format: "PDF",
              entitlement: { allowed: true, reason: "A könyv szabadon letölthető.", isPrivate: false },
            },
          ],
          reviews: [],
        });
      }

      return NextResponse.json({ error: "Könyv nem található." }, { status: 404 });
    }

    const edition = book.editions[0];
    const primaryCover = edition?.covers.find((c: any) => c.isPrimary) || edition?.covers[0];

    // Compute entitlement for each file
    const filesWithEntitlement = (edition?.files || []).map((file: any) => {
      const entitlement = canUserDownload(
        currentUser,
        {
          id: edition.id,
          bookId: book.id,
          distributionStatus: edition.distributionStatus as any,
          libraryReleaseAt: edition.libraryReleaseAt,
          ownerUserId: edition.ownerUserId,
        },
        {
          id: file.id,
          editionId: edition.id,
          distributionStatus: file.distributionStatus as any,
        }
      );

      return {
        id: file.id,
        fileName: file.fileName,
        fileSizeBytes: Number(file.fileSizeBytes),
        mimeType: file.mimeType,
        qualityScore: file.qualityScore,
        format: file.fileName.split(".").pop()?.toUpperCase() || "EPUB",
        entitlement,
      };
    });

    return NextResponse.json({
      id: book.id,
      slug: book.slug,
      title: book.title,
      originalTitle: book.originalTitle,
      description: book.description,
      aiSummary: book.aiSummary,
      language: book.language,
      averageRating: book.averageRating,
      ratingsCount: book.ratingsCount,
      authors: (book.authors || []).map((ba: any) => ({ id: ba.author?.id || ba.id, name: ba.author?.name || "Ismeretlen" })),
      series: (book as any).series?.[0]
        ? {
            id: (book as any).series[0].series?.id,
            name: (book as any).series[0].series?.name,
            position: (book as any).series[0].position,
          }
        : null,
      categories: (book.categories || []).map((bc: any) => ({ id: bc.category?.id || bc.id, name: bc.category?.name || "", slug: bc.category?.slug || "" })),
      tags: (book.tags || []).map((bt: any) => ({ id: bt.tag?.id || bt.id, name: bt.tag?.name || "" })),
      edition: edition
        ? {
            id: edition.id,
            publisher: edition.publisher?.name || null,
            publishedYear: edition.publishedYear,
            isbn10: edition.isbn10,
            isbn13: edition.isbn13,
            pages: edition.pages,
            distributionStatus: edition.distributionStatus,
            libraryReleaseAt: edition.libraryReleaseAt,
            rightsSource: edition.rightsSource,
            rightsLicense: edition.rightsLicense,
          }
        : null,
      coverUrl: primaryCover?.coverUrl || null,
      files: filesWithEntitlement,
      reviews: (book.reviews || []).map((r: any) => ({
        id: r.id,
        userName: r.user?.profile?.displayName || "Névtelen olvasó",
        userAvatar: r.user?.profile?.avatarUrl,
        rating: r.rating,
        text: r.text,
        spoiler: r.spoiler,
        likeCount: r.likeCount,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Hiba a könyvadatlap lekérésekor:", error);
    return NextResponse.json({ error: "Nem sikerült betölteni a könyvet." }, { status: 500 });
  }
}
