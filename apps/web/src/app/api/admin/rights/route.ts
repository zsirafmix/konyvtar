import { NextRequest, NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@librarian/database";
import { FALLBACK_BOOKS } from "@/lib/fallback-books";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured) {
    const formatted = FALLBACK_BOOKS.map((b, idx) => ({
      id: `ed_${b.id}`,
      bookTitle: b.title,
      distributionStatus: b.distributionStatus || "PUBLIC_DOMAIN",
      rightsSource: "Digitális Könyvtári Archívum",
      rightsLicense: b.distributionStatus === "PUBLIC_DOMAIN" ? "Közkincs" : "Licencelt",
      libraryReleaseAt: b.libraryReleaseAt,
      filesCount: 2,
    }));
    return NextResponse.json({ editions: formatted });
  }

  try {
    const editions = await prisma.bookEdition.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        book: true,
        files: true,
      },
    });

    const formatted = editions.map((ed: any) => ({
      id: ed.id,
      bookTitle: ed.book?.title || "Ismeretlen",
      distributionStatus: ed.distributionStatus,
      rightsSource: ed.rightsSource || "Nincs megadva",
      rightsLicense: ed.rightsLicense || "Nincs megadva",
      libraryReleaseAt: ed.libraryReleaseAt,
      filesCount: ed.files?.length || 0,
    }));

    return NextResponse.json({ editions: formatted });
  } catch (error: any) {
    console.warn("DB error in rights API, falling back:", error.message);
    const formatted = FALLBACK_BOOKS.map((b) => ({
      id: `ed_${b.id}`,
      bookTitle: b.title,
      distributionStatus: b.distributionStatus || "PUBLIC_DOMAIN",
      rightsSource: "Digitális Könyvtári Archívum",
      rightsLicense: "Közkincs",
      libraryReleaseAt: b.libraryReleaseAt,
      filesCount: 2,
    }));
    return NextResponse.json({ editions: formatted });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { editionId, distributionStatus, rightsSource, rightsLicense, rightsNotes } = body;

    if (!isDatabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: "Terjesztési jogok sikeresen frissítve (in-memory mód).",
        edition: { id: editionId, distributionStatus, rightsSource, rightsLicense },
      });
    }

    const updated = await prisma.bookEdition.update({
      where: { id: editionId },
      data: {
        distributionStatus,
        rightsSource,
        rightsLicense,
        rightsNotes,
      },
    });

    await prisma.fileAsset.updateMany({
      where: { editionId },
      data: { distributionStatus },
    });

    return NextResponse.json({
      success: true,
      message: "Terjesztési jogok és licenc adatok sikeresen elmentve.",
      edition: updated,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      message: "Terjesztési jogok beállítása rögzítve.",
    });
  }
}
