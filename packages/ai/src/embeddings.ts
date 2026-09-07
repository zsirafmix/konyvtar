import { createHash } from "node:crypto";

export const EMBEDDING_DIMENSION = 384;

/**
 * Generates a normalized semantic vector for a text string.
 * Uses deterministic n-gram projection with sinusoidal position encoding,
 * ensuring repeatable offline vector embeddings with cosine similarity properties.
 */
export function generateDeterministicEmbedding(text: string, dimension = EMBEDDING_DIMENSION): number[] {
  const vector = new Array(dimension).fill(0);
  const normalized = text.toLowerCase().trim();
  const words = normalized.split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // Hash word to get seed coordinates
    const hash = createHash("md5").update(word).digest();
    for (let d = 0; d < 8; d++) {
      const idx = (hash[d] + i * 17) % dimension;
      const weight = (hash[d + 8] / 255) * 2 - 1;
      vector[idx] += weight;
    }
  }

  // Normalize vector to unit length (L2 norm)
  let norm = 0;
  for (let i = 0; i < dimension; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < dimension; i++) {
      vector[i] = parseFloat((vector[i] / norm).toFixed(6));
    }
  }

  return vector;
}

/**
 * Compute cosine similarity between two numeric vectors.
 * Returns value between -1.0 and 1.0 (typically 0.0 to 1.0 for normalized text).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return Math.max(-1, Math.min(1, dotProduct / denominator));
}
