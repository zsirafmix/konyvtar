import { Readable } from "node:stream";
import { createHash } from "node:crypto";
import {
  StorageProvider,
  StorageFileItem,
  StorageFileMetadata,
  DownloadOptions,
  DownloadResult,
} from "./provider.interface";

export interface MegaCredentials {
  email?: string;
  password?: string;
  sessionKey?: string;
}

export class MegaStorageProvider implements StorageProvider {
  readonly name = "mega";
  private credentials: MegaCredentials;
  private isConfigured: boolean;

  // In-memory catalog of virtual/cached files from MEGA for offline/dev or indexed storage
  private virtualFiles: Map<string, {
    fileKey: string;
    fileName: string;
    size: number;
    mime: string;
    hash: string;
    directDownloadUrl?: string;
  }> = new Map();

  constructor(credentials?: MegaCredentials) {
    this.credentials = credentials || {
      email: process.env.MEGA_EMAIL,
      password: process.env.MEGA_PASSWORD,
    };
    this.isConfigured = !!(this.credentials.email && this.credentials.password && this.credentials.email !== "user@example.com");

    // Initialize with standard demo/seed cloud files
    this.registerSampleCloudFiles();
  }

  private registerSampleCloudFiles() {
    const samples = [
      {
        fileKey: "mega:foundation_asimov.epub",
        fileName: "Isaac_Asimov_Foundation_1951.epub",
        size: 1420580,
        mime: "application/epub+zip",
        hash: "a3f5e9281c5d9a4b8e21a7834bcdef90123456789abcdef0123456789abcdef",
      },
      {
        fileKey: "mega:dune_herbert.pdf",
        fileName: "Frank_Herbert_Dune_Classic.pdf",
        size: 5892100,
        mime: "application/pdf",
        hash: "b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8",
      },
      {
        fileKey: "mega:neuromancer_gibson.epub",
        fileName: "William_Gibson_Neuromancer_v1.epub",
        size: 980200,
        mime: "application/epub+zip",
        hash: "c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0",
      },
    ];

    for (const s of samples) {
      this.virtualFiles.set(s.fileKey, s);
    }
  }

  async listFiles(prefix = ""): Promise<StorageFileItem[]> {
    const list: StorageFileItem[] = [];
    for (const [key, item] of this.virtualFiles.entries()) {
      if (!prefix || key.startsWith(prefix)) {
        list.push({
          fileKey: item.fileKey,
          fileName: item.fileName,
          fileSizeBytes: item.size,
          mimeType: item.mime,
          lastModified: new Date(),
          sha256Hash: item.hash,
        });
      }
    }
    return list;
  }

  async getMetadata(fileKey: string): Promise<StorageFileMetadata> {
    const item = this.virtualFiles.get(fileKey);
    if (!item) {
      // Create metadata from key
      const name = fileKey.split("/").pop() || fileKey;
      return {
        fileKey,
        fileName: name,
        fileSizeBytes: 2048576,
        mimeType: this.guessMimeType(name),
        sha256Hash: createHash("sha256").update(fileKey).digest("hex"),
      };
    }

    return {
      fileKey: item.fileKey,
      fileName: item.fileName,
      fileSizeBytes: item.size,
      mimeType: item.mime,
      sha256Hash: item.hash,
    };
  }

  async getFileStream(fileKey: string): Promise<Readable> {
    const metadata = await this.getMetadata(fileKey);
    // Return simulated byte stream for cloud content
    const sampleBuffer = Buffer.from(
      `Librarian AI Ebook Data Content Stream: ${metadata.fileName}\nFormat: ${metadata.mimeType}\nSize: ${metadata.fileSizeBytes} bytes.`
    );
    return Readable.from(sampleBuffer);
  }

  async generateDownload(fileKey: string, options?: DownloadOptions): Promise<DownloadResult> {
    const metadata = await this.getMetadata(fileKey);
    const filename = options?.dispositionFilename || metadata.fileName;
    const stream = await this.getFileStream(fileKey);

    return {
      stream,
      expiresAt: new Date(Date.now() + (options?.expiresInSeconds || 3600) * 1000),
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Type": metadata.mimeType,
      },
    };
  }

  async exists(fileKey: string): Promise<boolean> {
    return this.virtualFiles.has(fileKey);
  }

  async getChecksum(fileKey: string): Promise<string> {
    const item = this.virtualFiles.get(fileKey);
    if (item) return item.hash;
    return createHash("sha256").update(fileKey).digest("hex");
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
      default:
        return "application/octet-stream";
    }
  }
}
