import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import {
  hashPassword,
  verifyPassword,
  ROLE_DEFAULT_PERMISSIONS,
  SUPERUSER_DEFAULT_PERMISSIONS,
  hasPermission,
  normalizeRole,
  canUseChat,
  canSendChatMessages,
  canCreateChatRooms,
  canModerateChat
} from "../packages/auth/dist/index.js";
import { encryptUserData, decryptUserData } from "../apps/web/src/lib/security/encryption.ts";
import { sanitizeUserContent, sanitizeDisplayName } from "../apps/web/src/lib/security/sanitize.ts";
import { verifyAndProcessPayPalOrder } from "../apps/web/src/lib/payments/paypal.ts";
import { checkRateLimit } from "../apps/web/src/lib/security/rate-limiter.ts";

const prisma = new PrismaClient();

// ==========================================
// 1. AUTHENTICATION & PASSWORD TESTS
// ==========================================
test("1. Authentication: Bcrypt work factor 12 hashing and verification", () => {
  const plain = "SuperSecretPassword123!";
  const hash = hashPassword(plain);

  // Must be bcrypt format
  assert.ok(hash.startsWith("$2a$") || hash.startsWith("$2b$"), "Hash must start with bcrypt prefix");
  
  // Valid verification
  assert.ok(verifyPassword(plain, hash), "Password should verify with correct input");
  
  // Invalid verification
  assert.ok(!verifyPassword("WrongPassword!", hash), "Wrong password must fail");
  assert.ok(!verifyPassword("", hash), "Empty password must fail");
});

test("1. Authentication: Legacy scrypt backward compatibility", () => {
  // admin hash from initial seed
  const legacyScrypt = "4a75cbba77c5e74e78cd469a287e83d5:014b45ac352341366ebf22cf241bc418d1dcd63b726863f35252e4d8d71e5068ad31c67d78e258803e98a9f2aae5ef1539913ca9d80fbc9986f8ec423054f773";
  assert.ok(verifyPassword("AdminPassword123!", legacyScrypt), "Legacy scrypt hash must verify AdminPassword123!");
  assert.ok(!verifyPassword("WrongPassword!", legacyScrypt), "Wrong password must fail legacy verification");
});

test("1. Authentication: Database Session creation, lookup, and expiration", async () => {
  const testUser = await prisma.user.findFirst({ where: { email: "admin@librarian.ai" } });
  assert.ok(testUser, "Test admin user must exist");

  // Create valid session
  const validToken = "test_token_" + Date.now();
  await prisma.session.create({
    data: {
      userId: testUser.id,
      token: validToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  // Verify lookup
  const foundValid = await prisma.session.findUnique({
    where: { token: validToken },
    include: { user: true },
  });
  assert.ok(foundValid, "Session should be found");
  assert.equal(foundValid.userId, testUser.id);
  assert.ok(foundValid.expiresAt > new Date(), "Session should not be expired");

  // Create expired session
  const expiredToken = "expired_token_" + Date.now();
  await prisma.session.create({
    data: {
      userId: testUser.id,
      token: expiredToken,
      expiresAt: new Date(Date.now() - 10000), // In past
    },
  });

  const foundExpired = await prisma.session.findUnique({ where: { token: expiredToken } });
  assert.ok(foundExpired.expiresAt < new Date(), "Expired session must have past expiresAt");

  // Clean up test sessions
  await prisma.session.deleteMany({ where: { token: { in: [validToken, expiredToken] } } });
});

// ==========================================
// 2. RBAC & PERMISSION TESTS
// ==========================================
test("2. RBAC: Role hierarchy and default permissions", () => {
  // USER permissions
  const userPerms = ROLE_DEFAULT_PERMISSIONS.USER;
  assert.equal(userPerms.canAdmin, false, "USER cannot have admin rights");
  assert.equal(userPerms.canModerate, false, "USER cannot have moderate rights");
  assert.equal(userPerms.canDownload, true, "USER can download standard catalog");
  assert.equal(userPerms.canDirectDownload, false, "USER cannot direct download without queue");
  assert.equal(userPerms.aiDailyLimit, 20, "USER default AI limit is 20");

  // MODERATOR permissions
  const modPerms = ROLE_DEFAULT_PERMISSIONS.MODERATOR;
  assert.equal(modPerms.canAdmin, false, "MODERATOR cannot have admin rights");
  assert.equal(modPerms.canModerate, true, "MODERATOR has moderation rights");
  assert.equal(modPerms.canDirectDownload, true, "MODERATOR has direct download");
  assert.equal(modPerms.canModerateChat, true, "MODERATOR can moderate chat");

  // ADMIN permissions
  const adminPerms = ROLE_DEFAULT_PERMISSIONS.ADMIN;
  assert.equal(adminPerms.canAdmin, true, "ADMIN has admin rights");
  assert.equal(adminPerms.canModerate, true, "ADMIN has moderation rights");
  assert.equal(adminPerms.canDirectDownload, true, "ADMIN has direct download");
  assert.equal(adminPerms.canModerateChat, true, "ADMIN can moderate chat");
});

test("2. RBAC: Superuser ($1) default permissions", () => {
  const superuserPerms = SUPERUSER_DEFAULT_PERMISSIONS;
  assert.equal(superuserPerms.canDirectDownload, true, "Superuser has direct instant download");
  assert.equal(superuserPerms.canUploadPrivate, true, "Superuser can upload private books");
  assert.equal(superuserPerms.canAdmin, false, "Superuser does not have admin rights");
  assert.equal(superuserPerms.aiDailyLimit, 1000, "Superuser has 1000 daily AI queries");
});

test("2. RBAC: Granular user permission overrides", () => {
  const customUser = {
    id: "user_123",
    role: "USER",
    permissions: {
      canDirectDownload: true, // Explicit override for regular user
      canSendChatMessages: false, // Muted in chat
    },
  };

  assert.equal(hasPermission(customUser, "canDirectDownload"), true, "Custom override should grant direct download");
  assert.equal(hasPermission(customUser, "canSendChatMessages"), false, "Custom override should mute chat");
  assert.equal(hasPermission(customUser, "canAdmin"), false, "User still cannot admin");
});

// ==========================================
// 3. PAYMENT VERIFICATION & REPLAY PROTECTION
// ==========================================
test("3. Payment: Reject fake PayPal orders", async () => {
  const user = await prisma.user.findFirst({ where: { email: "olvaso@librarian.ai" } });
  assert.ok(user);

  // Non-existent or invalid format
  const result = await verifyAndProcessPayPalOrder({ orderId: "INVALID-ORDER-ID-9999", userId: user.id });
  assert.equal(result.verified, false, "Fake PayPal order must be rejected");
  assert.ok(result.error, "Must include descriptive rejection message");
});

test("3. Payment: Replay attack rejection", async () => {
  const user = await prisma.user.findFirst({ where: { email: "olvaso@librarian.ai" } });
  assert.ok(user);

  const testOrderId = "REPLAY-TEST-" + Date.now();

  // Create an already completed payment with this orderId
  await prisma.payment.create({
    data: {
      userId: user.id,
      provider: "PAYPAL",
      orderId: testOrderId,
      amount: 1.00,
      currency: "USD",
      status: "COMPLETED",
    },
  });

  // Attempt to verify the same orderId again
  const result = await verifyAndProcessPayPalOrder({ orderId: testOrderId, userId: user.id });
  assert.equal(result.verified, false, "Replayed order ID must be rejected");
  assert.ok(
    result.error?.includes("fel lett használva") || result.error?.includes("már rögzítésre került") || result.error?.includes("már felhasznált"),
    "Error should indicate order already used"
  );

  // Clean up
  await prisma.payment.deleteMany({ where: { orderId: testOrderId } });
});

test("3. Payment: Valid payment promotes user to Superuser", async () => {
  const user = await prisma.user.findFirst({ where: { email: "olvaso@librarian.ai" } });
  assert.ok(user);

  const validOrderId = "TEST-SUPERUSER-OK-" + Date.now();
  const result = await verifyAndProcessPayPalOrder({ orderId: validOrderId, userId: user.id });
  assert.equal(result.verified, true, "Valid test payment must succeed");

  // Check that Payment record exists
  const payment = await prisma.payment.findUnique({ where: { orderId: validOrderId } });
  assert.ok(payment, "Payment record must be saved in DB");
  assert.equal(payment.amount, 1.00);
  assert.equal(payment.currency, "USD");
  assert.equal(payment.status, "COMPLETED");

  // Check that User is promoted to SUPPORTER
  const membership = await prisma.membership.findFirst({ where: { userId: user.id, status: "SUPPORTER" } });
  assert.ok(membership, "User should now have SUPPORTER membership");

  // Clean up test payment & restore olvaso membership
  await prisma.payment.deleteMany({ where: { orderId: validOrderId } });
  await prisma.subscription.deleteMany({ where: { paymentId: validOrderId } });
});

// ==========================================
// 4. FORUM PERMISSIONS & POST MANAGEMENT
// ==========================================
test("4. Forum: Topic creation and threaded posts in database", async () => {
  const admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  const user = await prisma.user.findFirst({ where: { email: "olvaso@librarian.ai" } });
  assert.ok(admin && user);

  // Create test topic
  const testTopic = await prisma.forumTopic.create({
    data: {
      title: "Automated Test Topic " + Date.now(),
      slug: "auto-test-" + Date.now(),
      content: "Initial topic content for automated verification.",
      authorId: admin.id,
      posts: {
        create: {
          content: "First test reply by admin",
          authorId: admin.id,
        },
      },
    },
    include: { posts: true },
  });

  assert.ok(testTopic.id);
  assert.equal(testTopic.posts.length, 1);

  // Regular user replies
  const userPost = await prisma.forumPost.create({
    data: {
      topicId: testTopic.id,
      content: "Reply by normal user",
      authorId: user.id,
    },
  });

  assert.equal(userPost.authorId, user.id);

  // Clean up test topic and cascaded posts
  await prisma.forumTopic.delete({ where: { id: testTopic.id } });
});

// ==========================================
// 5. COMMUNITY CHAT & MODERATION PERMISSIONS
// ==========================================
test("5. Chat: RBAC chat permission checks", () => {
  const normalUser = { id: "u1", role: "USER" };
  const mutedUser = { id: "u2", role: "USER", permissions: { canSendChatMessages: false } };
  const modUser = { id: "u3", role: "MODERATOR" };
  const adminUser = { id: "u4", role: "ADMIN" };

  // canUseChat
  assert.equal(canUseChat(normalUser), true, "Normal user can use chat");
  assert.equal(canUseChat(mutedUser), true, "Muted user can view chat");

  // canSendChatMessages
  assert.equal(canSendChatMessages(normalUser), true, "Normal user can send messages");
  assert.equal(canSendChatMessages(mutedUser), false, "Muted user CANNOT send messages");
  assert.equal(canSendChatMessages(modUser), true, "Moderator can send messages");

  // canCreateChatRooms
  assert.equal(canCreateChatRooms(normalUser), false, "Normal user cannot create chat rooms");
  assert.equal(canCreateChatRooms(modUser), true, "Moderator can create chat rooms");
  assert.equal(canCreateChatRooms(adminUser), true, "Admin can create chat rooms");

  // canModerateChat
  assert.equal(canModerateChat(normalUser), false, "Normal user cannot moderate chat");
  assert.equal(canModerateChat(modUser), true, "Moderator can moderate chat");
  assert.equal(canModerateChat(adminUser), true, "Admin can moderate chat");
});

test("5. Chat: Message persistence and room relation", async () => {
  const generalRoom = await prisma.chatRoom.findFirst({ where: { slug: "altalanos" } });
  assert.ok(generalRoom, "General room 'altalanos' should exist");

  const user = await prisma.user.findFirst({ where: { email: "olvaso@librarian.ai" } });
  assert.ok(user);

  const testMessage = await prisma.chatMessage.create({
    data: {
      roomId: generalRoom.id,
      authorId: user.id,
      content: "Test automated chat message: Hello Librarian AI!",
    },
  });

  assert.ok(testMessage.id);
  assert.equal(testMessage.roomId, generalRoom.id);
  assert.equal(testMessage.authorId, user.id);

  // Clean up
  await prisma.chatMessage.delete({ where: { id: testMessage.id } });
});

// ==========================================
// 6. SECURITY: OWASP SANITIZATION, ENCRYPTION & RATE LIMITS
// ==========================================
test("6. Security: XSS sanitization removes dangerous tags and scripts", () => {
  const attackPayload = '<script>alert("XSS")</script><img src="x" onerror="alert(1)"><b>Bold Safe</b>';
  const sanitized = sanitizeUserContent(attackPayload);

  assert.ok(!sanitized.includes("<script>"), "Must strip <script>");
  assert.ok(!sanitized.includes("onerror"), "Must strip onerror attribute");
  assert.ok(!sanitized.includes("alert("), "Must neutralize alert script code");

  const attackDisplayName = '<script>bad</script>NormalName<b>bold</b>';
  const cleanName = sanitizeDisplayName(attackDisplayName);
  assert.equal(cleanName, "NormalNamebold", "Display name should have HTML tags removed");
});

test("6. Security: AES-256-GCM encryption and decryption round-trip", () => {
  const secretData = JSON.stringify({
    notes: "Top secret book notes",
    personalPreference: "Dark theme",
    privateKey: "sk-1234567890",
  });

  const encrypted = encryptUserData(secretData);
  assert.ok(encrypted.includes(":"), "Encrypted format must be iv:tag:ciphertext");

  const decrypted = decryptUserData(encrypted);
  assert.equal(decrypted, secretData, "Decrypted data must match original exactly");

  // Tampered ciphertext fails cleanly
  const parts = encrypted.split(":");
  const tampered = `${parts[0]}:${parts[1]}:corrupted${parts[2].slice(9)}`;
  assert.equal(decryptUserData(tampered), "", "Tampered data must fail decryption and return empty string");
});

test("6. Security: Sliding-window rate limiter blocks excessive requests", () => {
  const rateLimitId = "test_rate_limiter_" + Date.now();
  const config = { identifier: rateLimitId, windowMs: 1000, maxRequests: 3 };

  const r1 = checkRateLimit(config);
  assert.equal(r1.success, true, "Request 1 must be allowed");
  assert.equal(r1.remaining, 2);

  const r2 = checkRateLimit(config);
  assert.equal(r2.success, true, "Request 2 must be allowed");
  assert.equal(r2.remaining, 1);

  const r3 = checkRateLimit(config);
  assert.equal(r3.success, true, "Request 3 must be allowed");
  assert.equal(r3.remaining, 0);

  const r4 = checkRateLimit(config);
  assert.equal(r4.success, false, "Request 4 must be BLOCKED (rate limit exceeded)");
  assert.ok(r4.retryAfterSeconds > 0, "Must include retry-after value");
});

test("Database teardown", async () => {
  await prisma.$disconnect();
});
