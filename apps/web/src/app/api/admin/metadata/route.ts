import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory review queue items for administration review
let reviewQueue = [
  {
    id: "rev_01",
    rawFilename: "Isaac_Asimov_Foundation_SCAN_final_v2.pdf",
    detectedTitle: "Foundation",
    detectedAuthor: "Isaac Asimov",
    detectedSeries: "Foundation",
    detectedSeriesNumber: 1,
    titleConfidence: 0.99,
    authorConfidence: 0.98,
    seriesConfidence: 0.84,
    overallConfidence: 0.94,
    status: "PENDING", // PENDING, APPROVED, REJECTED
    suggestedSource: "AI Regex + Heurisztika",
    createdAt: new Date().toISOString(),
  },
  {
    id: "rev_02",
    rawFilename: "Herbert_Frank-Children_of_Dune_v3_epub.epub",
    detectedTitle: "Children of Dune",
    detectedAuthor: "Frank Herbert",
    detectedSeries: "Dűne",
    detectedSeriesNumber: 3,
    titleConfidence: 0.89,
    authorConfidence: 0.92,
    seriesConfidence: 0.78,
    overallConfidence: 0.86,
    status: "PENDING",
    suggestedSource: "Open Library Match",
    createdAt: new Date().toISOString(),
  },
  {
    id: "rev_03",
    rawFilename: "Kovacs_B_Hidtervezes_szelcsatorna_jegyz_ocr.pdf",
    detectedTitle: "Hídtervezés szélcsatorna jegyzetek",
    detectedAuthor: "Kovács B.",
    detectedSeries: null,
    detectedSeriesNumber: null,
    titleConfidence: 0.65,
    authorConfidence: 0.68,
    seriesConfidence: 0.0,
    overallConfidence: 0.66,
    status: "PENDING",
    suggestedSource: "Alacsony konfidenciájú OCR elemzés",
    createdAt: new Date().toISOString(),
  },
];

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
