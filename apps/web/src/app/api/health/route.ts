import { NextResponse } from "next/server";
import { prisma } from "@librarian/database";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const hasDbUrl = !!dbUrl && dbUrl !== "postgresql://...:5432/..." && !dbUrl.includes("user:password");

  let dbConnected = false;
  let bookCount = 0;
  let dbError: string | null = null;

  if (hasDbUrl) {
    try {
      bookCount = await prisma.book.count();
      dbConnected = true;
    } catch (err: any) {
      dbError = err.message || "Ismeretlen adatbázis hiba";
      console.error("Adatbázis ellenőrzési hiba:", err);
    }
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: {
      hasDatabaseUrl: hasDbUrl,
      dbConnected,
      bookCount,
      error: dbError,
    },
    mega: {
      folderUrl: process.env.MEGA_FOLDER_URL || "https://mega.nz/folder/qNIjgLSB#NduwPvQZ4JlvEl-fIjZbkA",
      status: "online",
    },
  });
}
