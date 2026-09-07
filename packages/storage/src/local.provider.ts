import { promises as fs, createReadStream, existsSync } from "node:fs";
import { join, relative, basename } from "node:path";
import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import {
  StorageProvider,
  StorageFileItem,
  StorageFileMetadata,
  DownloadOptions,
  DownloadResult,
} from "./provider.interface";

export class LocalStorageProvider implements StorageProvider {
  readonly name = "local";
  private rootDir: string;

  constructor(rootDir: string = process.env.STORAGE_LOCAL_ROOT || "./storage_data") {
    this.rootDir = rootDir;
    if (!existsSync(this.rootDir)) {
      try {
        fs.mkdir(this.rootDir, { recursive: true }).catch(() => {});
      } catch {
        // Handled silently
      }
    }
  }

  private resolvePath(fileKey: string): string {
    // Sanitize path to prevent directory traversal
    const safeKey = fileKey.replace(/^(\.\.(\/|\\|$))+/, "");
    return join(this.rootDir, safeKey);
  }

  async listFiles(prefix = ""): Promise<StorageFileItem[]> {
    const results: StorageFileItem[] = [];
    const targetDir = this.resolvePath(prefix);

    if (!existsSync(targetDir)) {
      return results;
    }

    const scan = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          const relPath = relative(this.rootDir, fullPath);
          results.push({
            fileKey: relPath,
            fileName: entry.name,
            fileSizeBytes: stats.size,
            mimeType: this.guessMimeType(entry.name),
            lastModified: stats.mtime,
          });
        }
      }
    };

    await scan(targetDir);
    return results;
  }

  async getMetadata(fileKey: string): Promise<StorageFileMetadata> {
    const fullPath = this.resolvePath(fileKey);
    const stats = await fs.stat(fullPath);
    const sha256Hash = await this.getChecksum(fileKey);

    return {
      fileKey,
      fileName: basename(fullPath),
      fileSizeBytes: stats.size,
      mimeType: this.guessMimeType(fullPath),
      sha256Hash,
    };
  }

  async getFileStream(fileKey: string): Promise<Readable> {
    const fullPath = this.resolvePath(fileKey);
    if (!existsSync(fullPath)) {
      throw new Error(`Fájl nem található: ${fileKey}`);
    }
    return createReadStream(fullPath);
  }

  async generateDownload(fileKey: string, options?: DownloadOptions): Promise<DownloadResult> {
    const stream = await this.getFileStream(fileKey);
    const filename = options?.dispositionFilename || basename(fileKey);

    return {
      stream,
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Type": this.guessMimeType(filename),
      },
    };
  }

  async exists(fileKey: string): Promise<boolean> {
    return existsSync(this.resolvePath(fileKey));
  }

  async getChecksum(fileKey: string): Promise<string> {
    const fullPath = this.resolvePath(fileKey);
    return new Promise((resolve, reject) => {
      const hash = createHash("sha256");
      const stream = createReadStream(fullPath);
      stream.on("data", (chunk) => hash.update(chunk));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", reject);
    });
  }

  private guessMimeType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "epub":
        return "application/epub+zip";
      case "pdf":
        return "application/pdf";
      case "mobi":
        return "application/x-mobipocket-ebook";
      case "azw3":
        return "application/vnd.amazon.ebook";
      case "fb2":
        return "application/x-fictionbook+xml";
      case "txt":
        return "text/plain";
      case "djvu":
        return "image/vnd.djvu";
      default:
        return "application/octet-stream";
    }
  }
}
