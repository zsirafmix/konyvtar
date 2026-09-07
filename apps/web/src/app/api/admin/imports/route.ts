import { NextRequest, NextResponse } from "next/server";
import { defaultJobQueue } from "@librarian/jobs";
import { defaultStorageManager } from "@librarian/storage";
import { extractMetadataFromFilename } from "@librarian/ai";

export const dynamic = "force-dynamic";

export async function GET() {
  const jobs = defaultJobQueue.getAllJobs();

  // If empty, populate with a sample active demo import job
  if (jobs.length === 0) {
    const job = defaultJobQueue.createJob("SCAN_STORAGE", 52131, { provider: "mega" });
    defaultJobQueue.updateProgress(job.id, 36829, "Metaadat kinyerés és borítókeresés folyamatban...", 52131);
  }

  return NextResponse.json({
    jobs: defaultJobQueue.getAllJobs(),
    queueMetrics: {
      activeWorkers: 4,
      throughputPerMinute: 420,
      storageStatus: "Online (MEGA + Helyi)",
      totalIndexedFiles: 52131,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const providerName = body.provider || "mega";

    const job = defaultJobQueue.createJob("SCAN_STORAGE", 120, { provider: providerName });

    // Simulate progressive scanning in background
    setTimeout(() => {
      defaultJobQueue.updateProgress(job.id, 30, "Fájlok listázása a felhőtárolóból...");
    }, 500);

    setTimeout(() => {
      defaultJobQueue.updateProgress(job.id, 75, "SHA-256 duplikátumszűrés és borítófelismerés...");
    }, 1500);

    setTimeout(() => {
      defaultJobQueue.completeJob(job.id, "Sikeres importálás: 120 fájl feldolgozva, 0 hiba.");
    }, 3000);

    return NextResponse.json({
      success: true,
      message: "Az importálási folyamat sikeresen elindult a háttérben.",
      jobId: job.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Nem sikerült elindítani az importot." }, { status: 500 });
  }
}
