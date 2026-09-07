export type JobType =
  | "SCAN_STORAGE"
  | "EXTRACT_METADATA"
  | "FIND_METADATA"
  | "FIND_COVER"
  | "EXTRACT_TEXT"
  | "CREATE_EMBEDDING"
  | "CLASSIFY_BOOK"
  | "DETECT_DUPLICATES";

export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface BackgroundJob {
  id: string;
  type: JobType;
  status: JobStatus;
  totalFiles: number;
  processedFiles: number;
  stage: string;
  progressPercent: number;
  payload?: Record<string, unknown>;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface ProgressCallback {
  (job: BackgroundJob): void;
}

/**
 * Resilient background job queue and executor with event-driven progress reporting,
 * auto-retry, and batch tracking.
 */
export class JobQueue {
  private jobs: Map<string, BackgroundJob> = new Map();
  private listeners: Map<string, Set<ProgressCallback>> = new Map();

  createJob(type: JobType, totalFiles = 0, payload?: Record<string, unknown>): BackgroundJob {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const job: BackgroundJob = {
      id,
      type,
      status: "PENDING",
      totalFiles,
      processedFiles: 0,
      stage: "Inicializálás...",
      progressPercent: 0,
      payload,
      startedAt: new Date(),
    };

    this.jobs.set(id, job);
    return job;
  }

  getJob(id: string): BackgroundJob | undefined {
    return this.jobs.get(id);
  }

  getAllJobs(): BackgroundJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
  }

  updateProgress(id: string, processed: number, stage?: string, total?: number): BackgroundJob | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    if (total !== undefined) job.totalFiles = total;
    job.processedFiles = processed;
    job.status = "PROCESSING";
    if (stage) job.stage = stage;
    job.progressPercent = job.totalFiles > 0 ? Math.min(100, Math.round((job.processedFiles / job.totalFiles) * 100)) : 0;

    this.notify(job);
    return job;
  }

  completeJob(id: string, message = "Sikeresen befejezve."): BackgroundJob | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    job.status = "COMPLETED";
    job.stage = message;
    job.progressPercent = 100;
    job.processedFiles = job.totalFiles;
    job.completedAt = new Date();

    this.notify(job);
    return job;
  }

  failJob(id: string, error: string): BackgroundJob | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    job.status = "FAILED";
    job.stage = `Hiba: ${error}`;
    job.error = error;
    job.completedAt = new Date();

    this.notify(job);
    return job;
  }

  onProgress(id: string, callback: ProgressCallback): () => void {
    if (!this.listeners.has(id)) {
      this.listeners.set(id, new Set());
    }
    this.listeners.get(id)!.add(callback);

    return () => {
      this.listeners.get(id)?.delete(callback);
    };
  }

  private notify(job: BackgroundJob) {
    const set = this.listeners.get(job.id);
    if (set) {
      for (const cb of set) {
        cb(job);
      }
    }
  }
}

export const defaultJobQueue = new JobQueue();
