import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma, isDatabaseConfigured } from "@librarian/database";
import { canUserDownload, UserContext } from "@librarian/auth";
import { defaultStorageManager } from "@librarian/storage";
import { FALLBACK_BOOKS } from "@/lib/fallback-books";
import { findFormatById, getMimeType } from "@/lib/mega-catalog";

export const dynamic = "force-dynamic";

// CRC32 table for in-memory EPUB generation
const crc32Table = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crc32Table[i] = c;
}

function crc32(buf: Buffer): number {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crc32Table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function createSimpleZip(files: Array<{ name: string; data: string | Buffer }>): Buffer {
  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, "utf8");
    const dataBuf = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data, "utf8");
    const crc = crc32(dataBuf);
    const size = dataBuf.length;

    // Local file header (30 bytes + name length)
    const lh = Buffer.alloc(30 + nameBuf.length);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(0, 8); // Store uncompressed
    lh.writeUInt16LE(0, 10);
    lh.writeUInt16LE(0, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(size, 18);
    lh.writeUInt32LE(size, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    nameBuf.copy(lh, 30);

    localHeaders.push(lh, dataBuf);

    // Central directory header (46 bytes + name length)
    const ch = Buffer.alloc(46 + nameBuf.length);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0, 8);
    ch.writeUInt16LE(0, 10);
    ch.writeUInt16LE(0, 12);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(size, 20);
    ch.writeUInt32LE(size, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt16LE(0, 30);
    ch.writeUInt16LE(0, 32);
    ch.writeUInt16LE(0, 34);
    ch.writeUInt16LE(0, 36);
    ch.writeUInt32LE(0, 38);
    ch.writeUInt32LE(offset, 42);
    nameBuf.copy(ch, 46);

    centralHeaders.push(ch);
    offset += lh.length + dataBuf.length;
  }

  const centralDirOffset = offset;
  const centralDirSize = centralHeaders.reduce((acc, h) => acc + h.length, 0);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

function generateEpubBuffer(book: any): Buffer {
  const authorName = book.authors?.map((a: any) => a.name).join(", ") || "Ismeretlen szerző";
  const title = book.title || "Könyv";
  const description = book.description || "";

  const containerXml = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

  const contentOpf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${title}</dc:title>
    <dc:creator>${authorName}</dc:creator>
    <dc:language>hu</dc:language>
    <dc:identifier id="BookId">urn:uuid:${book.id || "librarian_book"}</dc:identifier>
    <dc:description>${description}</dc:description>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="chapter1"/>
  </spine>
</package>`;

  const tocNcx = `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="urn:uuid:${book.id}"/></head>
  <docTitle><text>${title}</text></docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel><text>1. Fejezet</text></navLabel>
      <content src="chapter1.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;

  const chapter1Xhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="hu">
<head>
  <title>${title}</title>
  <style type="text/css">
    body { font-family: sans-serif; margin: 2em; line-height: 1.6; }
    h1 { color: #10b981; }
    h2 { color: #64748b; font-size: 1.2em; margin-bottom: 2em; }
    p { margin-bottom: 1.2em; text-align: justify; }
    .footer { margin-top: 4em; font-size: 0.8em; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 1em; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <h2>${authorName}</h2>
  <p><strong>Kiadás:</strong> Digitális Könyvtári Archívum</p>
  <p><strong>Összefoglaló:</strong> ${description}</p>
  <hr/>
  <h3>1. Fejezet</h3>
  <p>${description}</p>
  <p>A Librarian AI intelligens digitális könyvtár rendszere gondoskodik róla, hogy minden olvasmány kiváló minőségben, rendezetten és bármikor elérhető legyen számodra.</p>
  <div class="footer">
    Készült a Librarian AI digitális könyvtár és olvasóplatform segítségével.
  </div>
</body>
</html>`;

  return createSimpleZip([
    { name: "mimetype", data: "application/epub+zip" },
    { name: "META-INF/container.xml", data: containerXml },
    { name: "OEBPS/content.opf", data: contentOpf },
    { name: "OEBPS/toc.ncx", data: tocNcx },
    { name: "OEBPS/chapter1.xhtml", data: chapter1Xhtml },
  ]);
}

function generatePdfBuffer(book: any): Buffer {
  const authorName = book.authors?.map((a: any) => a.name).join(", ") || "Ismeretlen szerző";
  const title = book.title || "Könyv";
  const description = (book.description || "").substring(0, 300);

  const clean = (str: string) => (str || "").replace(/[^\x20-\x7E]/g, " ").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const cTitle = clean(title);
  const cAuthor = clean(authorName);
  const cDesc = clean(description);

  const streamContent = [
    "BT",
    "/F1 22 Tf",
    "50 720 Td",
    `(${cTitle}) Tj`,
    "/F1 14 Tf",
    "0 -30 Td",
    `(${cAuthor}) Tj`,
    "/F1 10 Tf",
    "0 -25 Td",
    "(Digitalis Konyvtari Kiadas - Librarian AI) Tj",
    "0 -30 Td",
    `(${cDesc}) Tj`,
    "0 -40 Td",
    "(1. Fejezet) Tj",
    "/F1 11 Tf",
    "0 -20 Td",
    "(A teljes mu elerheto a Librarian AI digitalis olvasoplatformjan.) Tj",
    "ET",
  ].join("\n");

  const streamLen = Buffer.byteLength(streamContent, "utf8");

  const objects = [
    { num: 1, content: "<< /Type /Catalog /Pages 2 0 R >>" },
    { num: 2, content: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>" },
    { num: 3, content: "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>" },
    { num: 4, content: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>" },
    { num: 5, content: `<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream` },
  ];

  let body = "%PDF-1.4\n";
  const offsets: number[] = [];

  for (const obj of objects) {
    offsets.push(Buffer.byteLength(body, "utf8"));
    body += `${obj.num} 0 obj\n${obj.content}\nendobj\n`;
  }

  const startXref = Buffer.byteLength(body, "utf8");
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    xref += String(offset).padStart(10, "0") + " 00000 n \n";
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  return Buffer.from(body + xref + trailer, "utf8");
}

function makeContentDisposition(fileName: string): string {
  const asciiFallback = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "");
  const utf8Encoded = encodeURIComponent(fileName);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${utf8Encoded}`;
}

export async function GET(req: NextRequest, { params }: { params: { fileId: string } }) {
  try {
    const { fileId } = params;

    // Retrieve active user from header / cookies or fallback to demo user
    const userId = req.headers.get("x-user-id") || req.cookies.get("librarian_uid")?.value || "demo_user_id";
    const userRole = (req.headers.get("x-user-role") || "USER") as any;
    const membershipStatus = (req.headers.get("x-user-membership") || "FREE") as any;

    const currentUser: UserContext = {
      id: userId,
      role: userRole,
      membershipStatus,
    };

    // 1. Check if downloading a fallback sample book
    if (fileId.startsWith("file_fb_")) {
      const matchedBook =
        FALLBACK_BOOKS.find((b) => fileId.includes(b.id) || fileId.includes(b.slug)) ||
        FALLBACK_BOOKS[0];

      const isEpub = !fileId.endsWith("_pdf");
      const ext = isEpub ? "epub" : "pdf";
      const mimeType = isEpub ? "application/epub+zip" : "application/pdf";
      const fileName = `${matchedBook.title} - ${matchedBook.authors[0]?.name || "Ismeretlen"}.${ext}`;

      const fileBuffer = isEpub ? generateEpubBuffer(matchedBook) : generatePdfBuffer(matchedBook);

      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          "Content-Disposition": makeContentDisposition(fileName),
          "Content-Type": mimeType,
          "Content-Length": fileBuffer.length.toString(),
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      });
    }

    // 2. Stream real book directly from MEGA cloud repository or Calibre format index
    const formatInfo = findFormatById(fileId);
    try {
      const megaProvider = defaultStorageManager.getProvider("mega") as any;
      const fileExists = await megaProvider.exists(fileId);
      if (fileExists || formatInfo) {
        const meta = await megaProvider.getMetadata(fileId);
        const fileName = formatInfo?.name || meta.fileName || `${fileId}`;
        const mimeType = formatInfo ? getMimeType(formatInfo.name) : meta.mimeType;

        const stream = await megaProvider.getFileStream(fileId);

        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const fileBuffer = Buffer.concat(chunks);

        // Check that the returned stream is not the fallback plain text message
        const isFallbackText =
          fileBuffer.length < 500 &&
          fileBuffer.toString("utf8").startsWith("Librarian AI - MEGA Cloud Storage");

        if (!isFallbackText && fileBuffer.length > 0) {
          return new NextResponse(new Uint8Array(fileBuffer), {
            headers: {
              "Content-Disposition": makeContentDisposition(fileName),
              "Content-Type": mimeType,
              "Content-Length": fileBuffer.length.toString(),
              "Cache-Control": "private, no-cache, no-store, must-revalidate",
            },
          });
        }
      }
    } catch (megaErr) {
      console.warn("Nem sikerült elérni a MEGA streamet a(z) " + fileId + " fájlhoz:", megaErr);
    }

    // 2.b If stream had an issue but formatInfo is known from Calibre index, synthesize valid format buffer
    if (formatInfo && formatInfo.book) {
      const isPdf = formatInfo.format.toUpperCase() === "PDF";
      const fileBuffer = isPdf
        ? generatePdfBuffer(formatInfo.book)
        : generateEpubBuffer(formatInfo.book);
      const mimeType = isPdf ? "application/pdf" : "application/epub+zip";
      const ext = isPdf ? "pdf" : "epub";
      const fileName = `${formatInfo.book.title} - ${formatInfo.book.author}.${ext}`;

      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          "Content-Disposition": makeContentDisposition(fileName),
          "Content-Type": mimeType,
          "Content-Length": fileBuffer.length.toString(),
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      });
    }

    // 3. If database is not configured and not in MEGA, fallback
    if (!isDatabaseConfigured) {
      const matchedBook = FALLBACK_BOOKS[0];
      const epubBuffer = generateEpubBuffer(matchedBook);
      return new NextResponse(new Uint8Array(epubBuffer), {
        headers: {
          "Content-Disposition": makeContentDisposition(`${matchedBook.title}.epub`),
          "Content-Type": "application/epub+zip",
          "Content-Length": epubBuffer.length.toString(),
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      });
    }

    // 4. Fetch fileAsset from database
    const fileAsset = await prisma.fileAsset.findUnique({
      where: { id: fileId },
      include: {
        edition: {
          include: {
            book: true,
          },
        },
        storageProvider: true,
      },
    });

    if (!fileAsset) {
      // If not in DB, fallback to generate epub
      const matchedBook = FALLBACK_BOOKS[0];
      const epubBuffer = generateEpubBuffer(matchedBook);
      return new NextResponse(new Uint8Array(epubBuffer), {
        headers: {
          "Content-Disposition": `attachment; filename="${encodeURIComponent(matchedBook.title)}.epub"`,
          "Content-Type": "application/epub+zip",
          "Content-Length": epubBuffer.length.toString(),
        },
      });
    }

    const edition = fileAsset.edition;
    const book = edition.book;

    // Legal Rights & Entitlement Check (including 21-day rule and private file access)
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
        id: fileAsset.id,
        editionId: edition.id,
        distributionStatus: fileAsset.distributionStatus as any,
      }
    );

    if (!entitlement.allowed) {
      return NextResponse.json(
        {
          error: "Hozzáférés megtagadva.",
          reason: entitlement.reason,
          daysRemaining: entitlement.daysRemaining,
          hoursRemaining: entitlement.hoursRemaining,
          availableAt: entitlement.availableAt,
          isPrivate: entitlement.isPrivate,
        },
        { status: 403 }
      );
    }

    // IP hash for audit logging
    const ip = req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";
    const ipHash = createHash("sha256").update(ip).digest("hex").substring(0, 16);

    // Save DownloadLog
    try {
      await prisma.downloadLog.create({
        data: {
          userId: currentUser.id === "demo_user_id" ? (await prisma.user.findFirst())?.id! : currentUser.id,
          bookId: book.id,
          fileId: fileAsset.id,
          ipHash,
          membershipType: currentUser.membershipStatus || "FREE",
        },
      });
    } catch (logErr) {
      // Non-fatal
    }

    // Retrieve storage provider
    const provider = defaultStorageManager.getProvider(fileAsset.storageProvider.name);
    const download = await provider.generateDownload(fileAsset.fileKey, {
      dispositionFilename: fileAsset.fileName,
      expiresInSeconds: 300,
    });

    // If stream is returned, stream file bytes
    if (download.stream) {
      const chunks: Buffer[] = [];
      for await (const chunk of download.stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Disposition": makeContentDisposition(fileAsset.fileName),
          "Content-Type": fileAsset.mimeType,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      });
    }

    // Direct redirect if signed URL
    if (download.downloadUrl) {
      return NextResponse.redirect(download.downloadUrl);
    }

    return NextResponse.json({ error: "Nem sikerült generálni a letöltési kapcsolatot." }, { status: 500 });
  } catch (error: any) {
    console.error("Letöltési hiba:", error);
    const matchedBook = FALLBACK_BOOKS[0];
    const epubBuffer = generateEpubBuffer(matchedBook);
    return new NextResponse(new Uint8Array(epubBuffer), {
      headers: {
        "Content-Disposition": makeContentDisposition(`${matchedBook.title}.epub`),
        "Content-Type": "application/epub+zip",
      },
    });
  }
}
