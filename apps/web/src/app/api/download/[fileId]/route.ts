import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@librarian/database";
import { canUserDownload, UserContext } from "@librarian/auth";
import { defaultStorageManager } from "@librarian/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { fileId: string } }) {
  try {
    const { fileId } = params;

    // Retrieve active user from header / cookies or fallback to demo user
    const userId = req.headers.get("x-user-id") || req.cookies.get("librarian_uid")?.value;
    const userRole = (req.headers.get("x-user-role") || "USER") as any;
    const membershipStatus = (req.headers.get("x-user-membership") || "FREE") as any;

    if (!userId) {
      // Find default user from DB for demo/testing
      const defaultUser = await prisma.user.findFirst({
        include: { memberships: { orderBy: { createdAt: "desc" }, take: 1 } },
      });

      if (!defaultUser) {
        return NextResponse.json({ error: "A letöltéshez bejelentkezés szükséges." }, { status: 401 });
      }
    }

    const currentUser: UserContext = {
      id: userId || "demo_user_id",
      role: userRole,
      membershipStatus,
    };

    // Fetch fileAsset with its edition, book, and storage provider
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
      return NextResponse.json({ error: "A keresett fájl nem létezik a könyvtárban." }, { status: 404 });
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
      console.warn("Nem sikerült rögzíteni a letöltési naplót:", logErr);
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

      return new NextResponse(buffer, {
        headers: {
          "Content-Disposition": `attachment; filename="${encodeURIComponent(fileAsset.fileName)}"`,
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
    return NextResponse.json({ error: "Szerverhiba történt a letöltés során." }, { status: 500 });
  }
}
