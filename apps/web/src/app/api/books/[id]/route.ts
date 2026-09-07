import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@librarian/database";
import { canUserDownload, UserContext } from "@librarian/auth";

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

    const book = await prisma.book.findFirst({
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

    if (!book) {
      return NextResponse.json({ error: "Könyv nem található." }, { status: 404 });
    }

    const edition = book.editions[0];
    const primaryCover = edition?.covers.find((c) => c.isPrimary) || edition?.covers[0];

    // Compute entitlement for each file
    const filesWithEntitlement = (edition?.files || []).map((file) => {
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
      authors: book.authors.map((ba) => ({ id: ba.author.id, name: ba.author.name })),
      series: book.series[0]
        ? {
            id: book.series[0].series.id,
            name: book.series[0].series.name,
            position: book.series[0].position,
          }
        : null,
      categories: book.categories.map((bc) => ({ id: bc.category.id, name: bc.category.name, slug: bc.category.slug })),
      tags: book.tags.map((bt) => ({ id: bt.tag.id, name: bt.tag.name })),
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
      reviews: book.reviews.map((r) => ({
        id: r.id,
        userName: r.user.profile?.displayName || "Névtelen olvasó",
        userAvatar: r.user.profile?.avatarUrl,
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
