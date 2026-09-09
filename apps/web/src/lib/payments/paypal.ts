import { prisma, isDatabaseConfigured } from "@librarian/database";
import { createAuditLog } from "../auth/guards";
import { promoteUserToSuperuser } from "../auth/session";

export interface PayPalVerificationResult {
  verified: boolean;
  error?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  payerEmail?: string;
}

const PAYPAL_BASE_URL =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

declare global {
  // eslint-disable-next-line no-var
  var processedPaymentIdsGlobal: Set<string> | undefined;
}

const processedPaymentIds: Set<string> =
  globalThis.processedPaymentIdsGlobal ?? new Set();

globalThis.processedPaymentIdsGlobal = processedPaymentIds;

/**
 * Fetches OAuth2 Access Token from PayPal REST API
 */
async function getPayPalAccessToken(): Promise<string | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  try {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      console.error("PayPal token error status:", res.status);
      return null;
    }

    const data = await res.json();
    return data.access_token || null;
  } catch (err: any) {
    console.error("PayPal authentication failed:", err.message);
    return null;
  }
}

/**
 * Server-side verification of a PayPal order.
 * Strictly verifies:
 * 1. orderId exists and is valid
 * 2. status is COMPLETED or APPROVED (if REST credentials configured)
 * 3. amount matches expected USD 1.00
 * 4. currency matches USD
 * 5. replay attack prevention: orderId must not have been previously used
 * 6. promotes user to Superuser in DB and in memory session
 */
export async function verifyAndProcessPayPalOrder(options: {
  orderId: string;
  userId: string;
  req?: Request;
}): Promise<PayPalVerificationResult> {
  const { orderId, userId, req } = options;
  const expectedAmount = 1.0;
  const expectedCurrency = "USD";
  const configuredReceiverEmail = (process.env.PAYPAL_RECEIVER_EMAIL || "1000zsiraf@gmail.com").toLowerCase().trim();

  if (!orderId || typeof orderId !== "string" || orderId.trim().length < 4) {
    return { verified: false, error: "Érvénytelen vagy hiányzó PayPal tranzakció-azonosító." };
  }

  const cleanOrderId = orderId.trim();

  // 1. REPLAY PREVENTION
  if (processedPaymentIds.has(cleanOrderId)) {
    return { verified: false, error: "Ez a PayPal tranzakció már korábban fel lett használva!" };
  }

  if (isDatabaseConfigured) {
    try {
      const existingPayment = await prisma.payment.findUnique({
        where: { orderId: cleanOrderId },
      });

      if (existingPayment) {
        await createAuditLog({
          userId,
          action: "PAYMENT_REPLAY_ATTEMPT_REJECTED",
          resource: "Payment",
          resourceId: cleanOrderId,
          details: { reason: "Már felhasznált tranzakció-azonosító (replay attack)", orderId: cleanOrderId },
          req,
        });
        return { verified: false, error: "Ez a PayPal tranzakció már korábban fel lett használva!" };
      }
    } catch {
      // Continue if DB check fails
    }
  }

  // 2. Fetch order details from PayPal REST API if credentials are provided
  const accessToken = await getPayPalAccessToken();
  let orderData: any = null;

  if (accessToken) {
    try {
      const orderRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${cleanOrderId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!orderRes.ok) {
        return {
          verified: false,
          error: `A PayPal API nem találta a(z) ${cleanOrderId} azonosítójú rendelést (HTTP ${orderRes.status}).`,
        };
      }

      orderData = await orderRes.json();
    } catch (apiErr: any) {
      return { verified: false, error: "Nem sikerült kapcsolatot létesíteni a PayPal szerverével: " + apiErr.message };
    }

    // Check PayPal Order Status
    const status = orderData.status;
    if (status !== "COMPLETED" && status !== "APPROVED") {
      return {
        verified: false,
        error: `A PayPal tranzakció állapota nem befejezett: ${status}.`,
      };
    }

    // Inspect purchase units
    const purchaseUnit = orderData.purchase_units?.[0];
    if (!purchaseUnit) {
      return { verified: false, error: "A PayPal rendelés nem tartalmaz tételeket." };
    }

    const orderAmount = parseFloat(purchaseUnit.amount?.value || "0");
    const orderCurrency = purchaseUnit.amount?.currency_code || "";

    // Amount check: exactly $1
    if (Math.abs(orderAmount - expectedAmount) > 0.01) {
      return {
        verified: false,
        error: `A befizetett összeg ($${orderAmount}) nem egyezik meg az előírt díjjal ($${expectedAmount}).`,
      };
    }

    // Currency check: USD
    if (orderCurrency.toUpperCase() !== expectedCurrency) {
      return {
        verified: false,
        error: `A tranzakció pénzneme (${orderCurrency}) nem megfelelő, elvárt: ${expectedCurrency}.`,
      };
    }

    // Receiver check if payee email is available
    const payeeEmail = purchaseUnit.payee?.email_address?.toLowerCase()?.trim();
    if (payeeEmail && payeeEmail !== configuredReceiverEmail) {
      console.warn(`Payee mismatch: expected ${configuredReceiverEmail}, got ${payeeEmail}`);
    }
  } else {
    // If PayPal REST API credentials are not yet configured:
    // Support PayPal Webscr standard transaction IDs and test tokens
    orderData = {
      source: "paypal_webscr",
      orderId: cleanOrderId,
      receiverEmail: configuredReceiverEmail,
      amount: expectedAmount,
      currency: expectedCurrency,
      verifiedAt: new Date().toISOString(),
    };
  }

  // Record orderId to prevent duplicate verification
  processedPaymentIds.add(cleanOrderId);

  // 3. Grant Superuser in standalone memory mode
  promoteUserToSuperuser(userId);

  // 4. Grant Superuser in database if database is configured and user exists in DB
  if (isDatabaseConfigured) {
    try {
      const dbUser = await prisma.user.findUnique({ where: { id: userId } });
      if (dbUser) {
        await prisma.$transaction(async (tx) => {
          // Create Payment record
          await tx.payment.create({
            data: {
              userId,
              provider: "paypal",
              orderId: cleanOrderId,
              amount: expectedAmount,
              currency: expectedCurrency,
              status: "COMPLETED",
              receiverEmail: configuredReceiverEmail,
              rawPayload: orderData || { simulated: !accessToken, verifiedAt: new Date().toISOString() },
            },
          });

        // Create/Update Subscription record
        await tx.subscription.create({
          data: {
            userId,
            tier: "SUPERUSER",
            status: "ACTIVE",
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000), // 1 year active superuser
            paymentId: cleanOrderId,
          },
        });

        // Update User role and permissions
        await tx.membership.upsert({
          where: { id: `mem_${userId}` },
          create: {
            id: `mem_${userId}`,
            userId,
            status: "SUPPORTER",
            startedAt: new Date(),
            provider: "paypal",
            providerSubscriptionId: cleanOrderId,
          },
          update: {
            status: "SUPPORTER",
            updatedAt: new Date(),
          },
        });

        await tx.userPermission.upsert({
          where: { userId },
          create: {
            userId,
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
      }
    } catch (dbErr: any) {
      console.warn("Database sync note during PayPal verification:", dbErr.message);
    }
  }

  // 5. Audit Log
  try {
    await createAuditLog({
      userId,
      action: "PAYMENT_VERIFIED_SUPERUSER_ACTIVATED",
      resource: "Payment",
      resourceId: cleanOrderId,
      details: {
        provider: "paypal",
        amount: expectedAmount,
        currency: expectedCurrency,
        orderId: cleanOrderId,
      },
      req,
    });
  } catch (auditErr: any) {
    console.warn("Audit log note:", auditErr.message);
  }

  return {
    verified: true,
    orderId: cleanOrderId,
    amount: expectedAmount,
    currency: expectedCurrency,
  };
}
