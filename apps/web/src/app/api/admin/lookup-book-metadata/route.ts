import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth/guards";
import { parseBookFilename, fetchMetadataForBook } from "@/lib/book-metadata-lookup";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireRole(user, ["admin"]);

    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename") || "";
    const reqTitle = searchParams.get("title") || "";
    const reqAuthor = searchParams.get("author") || "";

    if (!filename && !reqTitle) {
      return NextResponse.json(
        { error: "Legalább a filename vagy title paraméter megadása kötelező." },
        { status: 400 }
      );
    }

    let searchTitle = reqTitle;
    let searchAuthor = reqAuthor;
    let initialYear: number | undefined;

    if (filename) {
      const parsed = parseBookFilename(filename);
      if (!searchTitle) searchTitle = parsed.cleanTitle;
      if (!searchAuthor) searchAuthor = parsed.cleanAuthor;
      initialYear = parsed.year;
    }

    const metadata = await fetchMetadataForBook(searchTitle, searchAuthor);
    if (initialYear && (!metadata.publishedYear || metadata.publishedYear === new Date().getFullYear())) {
      metadata.publishedYear = initialYear;
    }

    return NextResponse.json({
      success: true,
      metadata,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Nem sikerült a metaadatok lekérése." },
      { status: err.statusCode || 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireRole(user, ["admin"]);

    const body = await req.json().catch(() => ({}));
    const filename = body.filename || "";
    const reqTitle = body.title || "";
    const reqAuthor = body.author || "";

    if (!filename && !reqTitle) {
      return NextResponse.json(
        { error: "Legalább a filename vagy title paraméter megadása kötelező." },
        { status: 400 }
      );
    }

    let searchTitle = reqTitle;
    let searchAuthor = reqAuthor;
    let initialYear: number | undefined;

    if (filename) {
      const parsed = parseBookFilename(filename);
      if (!searchTitle) searchTitle = parsed.cleanTitle;
      if (!searchAuthor) searchAuthor = parsed.cleanAuthor;
      initialYear = parsed.year;
    }

    const metadata = await fetchMetadataForBook(searchTitle, searchAuthor);
    if (initialYear && (!metadata.publishedYear || metadata.publishedYear === new Date().getFullYear())) {
      metadata.publishedYear = initialYear;
    }

    return NextResponse.json({
      success: true,
      metadata,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Nem sikerült a metaadatok lekérése." },
      { status: err.statusCode || 500 }
    );
  }
}
