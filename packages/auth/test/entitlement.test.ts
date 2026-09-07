import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canUserDownload, FREE_MEMBER_DELAY_MS, UserContext, BookEditionContext } from "../src/permissions";

describe("Download Entitlement & Legal Rights (21-Day Rule)", () => {
  const now = new Date();

  // New book released 2 days ago
  const newReleaseDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  // Old book released 30 days ago (>21 days)
  const oldReleaseDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const freeUser: UserContext = {
    id: "user_free_1",
    role: "USER",
    membershipStatus: "FREE",
  };

  const supporterUser: UserContext = {
    id: "user_supporter_1",
    role: "USER",
    membershipStatus: "SUPPORTER",
  };

  const otherUser: UserContext = {
    id: "user_other_1",
    role: "USER",
    membershipStatus: "FREE",
  };

  const ownerUser: UserContext = {
    id: "user_owner_1",
    role: "USER",
    membershipStatus: "FREE",
  };

  const newPublicBook: BookEditionContext = {
    id: "ed_new_1",
    bookId: "book_1",
    distributionStatus: "LICENSED",
    libraryReleaseAt: newReleaseDate,
    ownerUserId: null,
  };

  const oldPublicBook: BookEditionContext = {
    id: "ed_old_1",
    bookId: "book_2",
    distributionStatus: "PUBLIC_DOMAIN",
    libraryReleaseAt: oldReleaseDate,
    ownerUserId: null,
  };

  const privateBook: BookEditionContext = {
    id: "ed_priv_1",
    bookId: "book_3",
    distributionStatus: "PRIVATE",
    libraryReleaseAt: newReleaseDate,
    ownerUserId: "user_owner_1",
  };

  it("RULE 1: FREE + new book (< 21 days) => DENIED with remaining days countdown", () => {
    const res = canUserDownload(freeUser, newPublicBook);
    assert.equal(res.allowed, false);
    assert.equal(res.isPrivate, false);
    assert.ok(res.daysRemaining !== undefined && res.daysRemaining > 0);
    assert.match(res.reason, /21 napos támogatói periódusban/);
  });

  it("RULE 2: FREE + 21 days passed => ALLOWED", () => {
    const res = canUserDownload(freeUser, oldPublicBook);
    assert.equal(res.allowed, true);
    assert.equal(res.isPrivate, false);
    assert.match(res.reason, /ingyenesen letölthető/);
  });

  it("RULE 3: SUPPORTER + new book (< 21 days) => ALLOWED immediately", () => {
    const res = canUserDownload(supporterUser, newPublicBook);
    assert.equal(res.allowed, true);
    assert.equal(res.isPrivate, false);
    assert.match(res.reason, /Támogatói tagságoddal azonnal/);
  });

  it("RULE 4: PRIVATE FILE + any other user => DENIED", () => {
    const res = canUserDownload(otherUser, privateBook);
    assert.equal(res.allowed, false);
    assert.equal(res.isPrivate, true);
    assert.match(res.reason, /kizárólag a feltöltő tulajdonos számára/);
  });

  it("RULE 5: PRIVATE FILE + owner user => ALLOWED", () => {
    const res = canUserDownload(ownerUser, privateBook);
    assert.equal(res.allowed, true);
    assert.equal(res.isPrivate, true);
    assert.match(res.reason, /Saját privát könyvfájl/);
  });
});
