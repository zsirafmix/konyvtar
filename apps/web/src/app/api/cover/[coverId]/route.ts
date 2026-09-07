import { NextRequest, NextResponse } from "next/server";
import { defaultStorageManager, MegaStorageProvider } from "@librarian/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { coverId: string } }) {
  try {
    const { coverId } = params;
    const megaProvider = defaultStorageManager.getProvider("mega") as MegaStorageProvider;

    const stream = await megaProvider.getCoverStream(coverId);
    if (!stream) {
      return new NextResponse(null, { status: 404 });
    }

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error: any) {
    console.error("Cover streaming error:", error);
    return new NextResponse(null, { status: 404 });
  }
}
