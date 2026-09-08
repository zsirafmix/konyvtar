import { NextResponse } from "next/server";
import { prisma, isDatabaseConfigured } from "@librarian/database";
import { getAllMegaBooks } from "@/lib/mega-catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const megaBooks = getAllMegaBooks();
  let dbConnected = false;
  let dbBookCount = 0;
  let dbError: string | null = null;

  if (isDatabaseConfigured) {
    try {
      dbBookCount = await prisma.book.count();
      dbConnected = true;
    } catch (err: any) {
      dbError = err.message || "Adatbázis kapcsolat nem elérhető";
    }
  }

  const effectiveBookCount = dbConnected && dbBookCount > 0 ? dbBookCount : megaBooks.length;

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    catalog: {
      status: "online",
      totalBooks: effectiveBookCount,
      indexedMegaBooks: megaBooks.length,
      mode: dbConnected && dbBookCount > 0 ? "database" : "calibre_cloud_index",
    },
    database: {
      isConfigured: isDatabaseConfigured,
      dbConnected,
      bookCount: dbBookCount,
      mode: isDatabaseConfigured ? (dbConnected ? "active" : "standby") : "standalone_cloud",
      ...(dbError ? { note: "Standalone felhő üzemmód aktív (Calibre index)" } : {}),
    },
    mega: {
      folderUrl: process.env.MEGA_FOLDER_URL || "https://mega.nz/folder/qNIjgLSB#NduwPvQZ4JlvEl-fIjZbkA",
      status: "online",
      indexedCount: megaBooks.length,
    },
  });
}
