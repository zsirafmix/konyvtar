import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory review queue items for administration review
let reviewQueue: any[] = [];

export async function GET() {
  return NextResponse.json({
    queue: reviewQueue,
    totalPending: reviewQueue.filter((q) => q.status === "PENDING").length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, updatedData } = body; // action: APPROVE, REJECT, EDIT

    const item = reviewQueue.find((q) => q.id === id);
    if (!item) {
      return NextResponse.json({ error: "A tétel nem található a felülvizsgálati sorban." }, { status: 404 });
    }

    if (action === "APPROVE") {
      item.status = "APPROVED";
    } else if (action === "REJECT") {
      item.status = "REJECTED";
    } else if (action === "EDIT" && updatedData) {
      item.detectedTitle = updatedData.title || item.detectedTitle;
      item.detectedAuthor = updatedData.author || item.detectedAuthor;
      item.status = "APPROVED";
    }

    return NextResponse.json({
      success: true,
      message: `Metaadat sikeresen frissítve: ${action}`,
      item,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Nem sikerült feldolgozni a módosítást." }, { status: 500 });
  }
}
