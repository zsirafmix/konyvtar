import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@librarian/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const editions = await prisma.bookEdition.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        book: true,
        files: true,
      },
    });

    const formatted = editions.map((ed) => ({
      id: ed.id,
      bookTitle: ed.book.title,
      distributionStatus: ed.distributionStatus,
      rightsSource: ed.rightsSource || "Nincs megadva",
      rightsLicense: ed.rightsLicense || "Nincs megadva",
      libraryReleaseAt: ed.libraryReleaseAt,
      filesCount: ed.files.length,
    }));

    return NextResponse.json({ editions: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: "Hiba a jogi adatok lekérésekor." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { editionId, distributionStatus, rightsSource, rightsLicense, rightsNotes } = body;

    const updated = await prisma.bookEdition.update({
      where: { id: editionId },
      data: {
        distributionStatus,
        rightsSource,
        rightsLicense,
        rightsNotes,
      },
    });

    // Also cascade to files of this edition
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
    return NextResponse.json({ error: "Nem sikerült menteni a terjesztési jogokat." }, { status: 500 });
  }
}
