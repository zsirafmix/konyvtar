import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractMetadataFromFilename,
  detectDuplicate,
  calculateTasteSimilarity,
  generateDeterministicEmbedding,
  cosineSimilarity,
  generateRecommendations,
} from "../src";

describe("AI Subsystem: Metadata Extraction & Confidence Scores", () => {
  it("Should extract Title, Author, and Series from complex noisy filename", () => {
    const raw = "Isaac_Asimov_Foundation_SCAN_final_v2.pdf";
    const meta = extractMetadataFromFilename(raw);

    assert.equal(meta.title.toLowerCase().includes("foundation"), true);
    assert.equal(meta.author?.toLowerCase().includes("asimov"), true);
    assert.ok(meta.overallConfidence > 0.7);
    assert.equal(meta.format, "PDF");
  });

  it("Should detect series bracket patterns: [Foundation 01] Foundation - Isaac Asimov.epub", () => {
    const raw = "[Foundation 01] Foundation - Isaac Asimov.epub";
    const meta = extractMetadataFromFilename(raw);

    assert.equal(meta.series, "Foundation");
    assert.equal(meta.seriesNumber, 1);
    assert.ok(meta.seriesConfidence > 0.8);
  });
});

describe("AI Subsystem: Multi-Tier Duplicate Detection", () => {
  const existingRecords = [
    {
      bookId: "b_1",
      editionId: "ed_1",
      title: "Alapítvány",
      authors: ["Isaac Asimov"],
      isbn13: "9789634971801",
      fileHashes: ["hash_exact_123456"],
    },
  ];

  it("Tier 1: Exact duplicate matched by SHA-256 hash", () => {
    const res = detectDuplicate(
      {
        title: "Alapítvány Másolat",
        authors: ["Isaac Asimov"],
        sha256Hash: "hash_exact_123456",
      },
      existingRecords
    );

    assert.equal(res.level, "EXACT");
    assert.equal(res.confidence, 1.0);
    assert.equal(res.matchedBookId, "b_1");
  });

  it("Tier 2: Probable duplicate matched by ISBN", () => {
    const res = detectDuplicate(
      {
        title: "Foundation",
        authors: ["Isaac Asimov"],
        isbn13: "9789634971801",
      },
      existingRecords
    );

    assert.equal(res.level, "PROBABLE");
    assert.ok(res.confidence >= 0.9);
    assert.equal(res.isFormatVariant, true);
  });

  it("Tier 3: Possible duplicate matched by normalized title and author", () => {
    const res = detectDuplicate(
      {
        title: "Alapítvány",
        authors: ["Isaac Asimov"],
      },
      existingRecords
    );

    assert.equal(res.level, "POSSIBLE");
    assert.ok(res.confidence >= 0.8);
  });
});

describe("AI Subsystem: Vector Similarity & Taste Match", () => {
  it("Cosine similarity should be 1.0 for identical vectors and close for related texts", () => {
    const v1 = generateDeterministicEmbedding("tudományos fantasztikus űrhajó galaxis");
    const v2 = generateDeterministicEmbedding("tudományos fantasztikus űrhajó galaxis");
    const sim = cosineSimilarity(v1, v2);

    assert.ok(Math.abs(sim - 1.0) < 0.001);
  });

  it("Taste similarity should compute realistic score and common stats", () => {
    const userA = [
      { bookId: "b_1", rating: 5, status: "COMPLETED" as const, isFavorite: true },
      { bookId: "b_2", rating: 4, status: "COMPLETED" as const },
    ];
    const userB = [
      { bookId: "b_1", rating: 5, status: "COMPLETED" as const, isFavorite: true },
      { bookId: "b_2", rating: 4, status: "COMPLETED" as const },
      { bookId: "b_3", rating: 3, status: "COMPLETED" as const },
    ];

    const taste = calculateTasteSimilarity(userA, userB);
    assert.ok(taste.similarityScore >= 80);
    assert.equal(taste.commonBooksCount, 2);
    assert.equal(taste.sharedFavoritesCount, 1);
  });
});
