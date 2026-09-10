import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, createAuditLog } from "@/lib/auth/guards";
import {
  addUploadedMegaBook,
  storeUploadedFileBuffer,
  toBookCard,
  MegaBookRecord,
} from "@/lib/mega-catalog";
import { prisma, isDatabaseConfigured } from "@librarian/database";
import { fetchMetadataForBook } from "@/lib/book-metadata-lookup";

export const dynamic = "force-dynamic";

const CURATED_DEFAULT_COVERS = [
  "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1476275466078-4007374efbbe?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop",
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 50);
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    requireRole(user, ["admin"]);

    const contentType = req.headers.get("content-type") || "";

    let title = "";
    let author = "";
    let genre = "Általános";
    let publishedYear = new Date().getFullYear();
    let description = "";
    let coverUrl = "";
    let fileName = "";
    let fileFormat = "EPUB";
    let fileBuffer: Buffer | null = null;
    let fileSize = 0;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      title = (formData.get("title") as string)?.trim() || "";
      author = (formData.get("author") as string)?.trim() || "";
      genre = (formData.get("genre") as string)?.trim() || "Általános";
      const yearRaw = formData.get("publishedYear") as string;
      if (yearRaw) {
        const parsed = parseInt(yearRaw, 10);
        if (!isNaN(parsed)) publishedYear = parsed;
      }
      description = (formData.get("description") as string)?.trim() || "";
      coverUrl = (formData.get("coverUrl") as string)?.trim() || "";

      // Handle cover image file
      const coverFile = formData.get("coverFile") as File | null;
      if (coverFile && coverFile.size > 0) {
        const bytes = await coverFile.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        const mime = coverFile.type || "image/jpeg";
        coverUrl = `data:${mime};base64,${base64}`;
      }

      // Handle ebook file
      const bookFile = formData.get("bookFile") as File | null;
      if (bookFile && bookFile.size > 0) {
        fileName = bookFile.name;
        fileSize = bookFile.size;
        const ext = fileName.split(".").pop()?.toUpperCase() || "EPUB";
        fileFormat = ext;
        const arrayBuf = await bookFile.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuf);
      }
    } else {
      const body = await req.json();
      title = body.title?.trim() || "";
      author = body.author?.trim() || "";
      genre = body.genre?.trim() || "Általános";
      if (body.publishedYear) publishedYear = Number(body.publishedYear);
      description = body.description?.trim() || "";
      coverUrl = body.coverUrl?.trim() || "";
      fileName = body.fileName || `${title || "konyv"}.epub`;
      fileFormat = body.fileFormat?.toUpperCase() || "EPUB";
      if (body.fileBase64) {
        fileBuffer = Buffer.from(body.fileBase64, "base64");
        fileSize = fileBuffer.length;
      }
    }

    if (!title) {
      return NextResponse.json({ error: "A könyv címének megadása kötelező." }, { status: 400 });
    }
    if (!author) {
      author = "Ismeretlen szerző";
    }

    try {
      const autoMeta = await fetchMetadataForBook(title, author);
      if (!coverUrl && autoMeta.coverUrl) {
        coverUrl = autoMeta.coverUrl;
      }
      if (!description && autoMeta.description) {
        description = autoMeta.description;
      }
      if ((author === "Ismeretlen szerző" || !author) && autoMeta.author && autoMeta.author !== "Ismeretlen szerző") {
        author = autoMeta.author;
      }
      if ((genre === "Általános" || !genre) && autoMeta.genre) {
        genre = autoMeta.genre;
      }
      if ((!publishedYear || publishedYear === new Date().getFullYear()) && autoMeta.publishedYear) {
        publishedYear = autoMeta.publishedYear;
      }
    } catch (e) {
      console.warn("Auto metadata lookup fallback on upload:", e);
    }

    if (!coverUrl) {
      const hash = Math.abs(
        (title + author).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
      );
      coverUrl = CURATED_DEFAULT_COVERS[hash % CURATED_DEFAULT_COVERS.length];
    }

    const timestamp = Date.now();
    const bookId = `mega_up_${timestamp}`;
    const baseSlug = slugify(title) || "konyv";
    const slug = `${baseSlug}-${timestamp.toString(36)}`;
    const fileId = `file_up_${timestamp}`;

    if (!fileName) {
      fileName = `${author} - ${title}.${fileFormat.toLowerCase()}`;
    }
    if (fileSize === 0) {
      fileSize = 1024 * 512; // 512 KB placeholder size if purely virtual
    }

    // If a physical file was uploaded, store its buffer for download serving
    if (fileBuffer) {
      const mime =
        fileFormat === "PDF"
          ? "application/pdf"
          : fileFormat === "MOBI"
          ? "application/x-mobipocket-ebook"
          : "application/epub+zip";
      storeUploadedFileBuffer(fileId, fileBuffer, mime, fileName);
    }

    const newBookRecord: MegaBookRecord = {
      id: bookId,
      title,
      author,
      calibreId: timestamp, // High ID ensures newest sort places it at position 0!
      slug,
      coverId: null,
      coverUrl,
      description:
        description ||
        `A(z) „${title}” című kötet az adminisztrátor által közvetlenül feltöltve a könyvtár MEGA felhőtárába. Szerző: ${author}. Műfaj: ${genre}.`,
      publishedYear,
      genre,
      isNewlyUploaded: true,
      libraryReleaseAt: new Date().toISOString(),
      formats: [
        {
          id: fileId,
          name: fileName,
          format: fileFormat,
          size: fileSize,
        },
      ],
    };

    // Add directly to in-memory MEGA index & global store
    addUploadedMegaBook(newBookRecord);

    // If PostgreSQL database is configured, also persist in DB
    if (isDatabaseConfigured) {
      try {
        await (prisma.book.create as any)({
          data: {
            title,
            slug,
            description: newBookRecord.description,
            averageRating: 5.0,
            ratingsCount: 1,
            editions: {
              create: [
                {
                  editionNumber: 1,
                  publishedYear,
                  distributionStatus: "PUBLIC_DOMAIN",
                  libraryReleaseAt: new Date(),
                  covers: {
                    create: [
                      {
                        coverSource: "upload",
                        coverUrl,
                        isPrimary: true,
                      },
                    ],
                  },
                },
              ],
            },
          },
        });
      } catch (dbErr: any) {
        console.warn("Prisma book creation note:", dbErr.message);
      }
    }

    await createAuditLog({
      userId: user.id,
      action: "ADMIN_UPLOADED_BOOK",
      resource: "Book",
      resourceId: bookId,
      details: { title, author, genre, fileFormat, fileSize },
      req,
    });

    return NextResponse.json({
      success: true,
      message: `A(z) „${title}” sikeresen feltöltve a MEGA tárhelyre és aktiválva a könyvtárban!`,
      book: toBookCard(newBookRecord),
    });
  } catch (err: any) {
    console.error("Könyv feltöltési hiba:", err);
    return NextResponse.json(
      { error: err.message || "Hiba történt a könyv feltöltése közben." },
      { status: err.statusCode || 500 }
    );
  }
}
