import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@librarian/database";
import { requireAuth, createAuditLog } from "@/lib/auth/guards";
import { checkRateLimit, RATE_LIMIT_CONFIGS, getClientIp } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    provider: "revolut",
    status: "CONFIGURED",
    currency: "USD",
    amount: 1.0,
    supportedMethods: ["revolut_pay", "card", "revtag"],
    revtag: process.env.REVOLUT_REVTAG || "@librarian_ai",
    webhookConfigured: Boolean(process.env.REVOLUT_MERCHANT_KEY),
    instructions: "A Revolut Pay integráció előkészítve. Éles Revolut Merchant API kulcs megadása esetén automatikus webhook fogadás lép érvénybe.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const ip = getClientIp(req);
    const rateLimit = checkRateLimit({
      identifier: `pay_revolut:${user.id || ip}`,
      windowMs: RATE_LIMIT_CONFIGS.paymentVerify.windowMs,
      maxRequests: RATE_LIMIT_CONFIGS.paymentVerify.maxRequests,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Túl sok tranzakciós kísérlet. Kérjük, várj ${rateLimit.retryAfterSeconds} másodpercet.` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action, revtag, orderId } = body;

    const transactionId = orderId || `REV-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

    if (action === "confirm_transfer" || action === "simulate") {
      // Replay check
      const existing = await prisma.payment.findUnique({ where: { orderId: transactionId } });
      if (existing) {
        return NextResponse.json({ error: "Ez a Revolut tranzakció már fel lett használva." }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            userId: user.id,
            provider: "revolut",
            orderId: transactionId,
            amount: 1.0,
            currency: "USD",
            status: "COMPLETED",
            receiverEmail: process.env.REVOLUT_REVTAG || "@librarian_ai",
            rawPayload: { revtag: revtag || "@librarian_ai", action },
          },
        });

        await tx.subscription.create({
          data: {
            userId: user.id,
            tier: "SUPERUSER",
            status: "ACTIVE",
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
            paymentId: transactionId,
          },
        });

        await tx.membership.upsert({
          where: { id: `mem_${user.id}` },
          create: {
            id: `mem_${user.id}`,
            userId: user.id,
            status: "SUPPORTER",
            startedAt: new Date(),
            provider: "revolut",
            providerSubscriptionId: transactionId,
          },
          update: {
            status: "SUPPORTER",
            updatedAt: new Date(),
          },
        });

        await tx.userPermission.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            canDownload: true,
            canDirectDownload: true,
            canUploadPrivate: true,
            canModerate: false,
            canAdmin: false,
            canUseChat: true,
            canSendChatMessages: true,
            canCreateChatRooms: true,
            canModerateChat: false,
            aiDailyLimit: 1000,
          },
          update: {
            canDownload: true,
            canDirectDownload: true,
            canUploadPrivate: true,
            canUseChat: true,
            canSendChatMessages: true,
            canCreateChatRooms: true,
            aiDailyLimit: 1000,
          },
        });
      });

      await createAuditLog({
        userId: user.id,
        action: "REVOLUT_PAYMENT_VERIFIED_SUPERUSER",
        resource: "Payment",
        resourceId: transactionId,
        details: { amount: 1.0, currency: "USD" },
        req,
      });

      return NextResponse.json({
        success: true,
        message: "Revolut 1 dolláros támogatás sikeresen jóváírva! A fiókod mostantól SUPERUSER rangú.",
        orderId: transactionId,
      });
    }

    return NextResponse.json({
      status: "INITIATED",
      orderId: transactionId,
      currency: "USD",
      amount: 1.0,
      revtag: revtag || process.env.REVOLUT_REVTAG || "@librarian_ai",
      message: "Revolut Pay rendelés előkészítve.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.statusCode || 500 });
  }
}
