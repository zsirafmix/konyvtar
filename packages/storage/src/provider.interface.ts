import { Readable } from "node:stream";

export interface StorageFileItem {
  fileKey: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  lastModified?: Date;
  sha256Hash?: string;
}

export interface StorageFileMetadata {
  fileKey: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  sha256Hash: string;
  customMetadata?: Record<string, unknown>;
}

export interface DownloadOptions {
  expiresInSeconds?: number;
  dispositionFilename?: string;
}

export interface DownloadResult {
  downloadUrl?: string; // Signed/temporary direct URL if applicable
  stream?: Readable;    // Direct stream if proxying through backend
  expiresAt?: Date;
  headers?: Record<string, string>;
}

export interface StorageProvider {
  readonly name: string;

  /**
   * Recursively list files under an optional prefix.
   */
  listFiles(prefix?: string): Promise<StorageFileItem[]>;

  /**
   * Retrieve file metadata and checksum.
   */
  getMetadata(fileKey: string): Promise<StorageFileMetadata>;

  /**
   * Open a readable stream for a file.
   */
  getFileStream(fileKey: string): Promise<Readable>;

  /**
   * Generate an authorized temporary download (either signed URL or stream).
   */
  generateDownload(fileKey: string, options?: DownloadOptions): Promise<DownloadResult>;

  /**
   * Check if a file exists in the storage.
   */
  exists(fileKey: string): Promise<boolean>;

  /**
   * Compute SHA-256 checksum of the file.
   */
  getChecksum(fileKey: string): Promise<string>;
}
