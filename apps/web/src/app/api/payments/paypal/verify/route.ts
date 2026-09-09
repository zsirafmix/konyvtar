import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { verifyAndProcessPayPalOrder } from "@/lib/payments/paypal";
import { checkRateLimit, RATE_LIMIT_CONFIGS, getClientIp } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let user = null;
    try {
      user = await requireAuth(req);
    } catch {
      // Allow unauthenticated verification if userEmail is supplied
    }

    const body = await req.json().catch(() => ({}));
    const { orderId, userEmail } = body;

    const targetUserId = user?.id || userEmail?.trim()?.toLowerCase();

    if (!targetUserId) {
      return NextResponse.json(
        { error: "A fiók azonosításához kérjük jelentkezz be, vagy add meg a fiókod e-mail címét." },
        { status: 400 }
      );
    }

    // Rate limit payment verifications
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit({
      identifier: `pay_verify:${targetUserId || ip}`,
      windowMs: RATE_LIMIT_CONFIGS.paymentVerify.windowMs,
      maxRequests: RATE_LIMIT_CONFIGS.paymentVerify.maxRequests,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Túl sok ellenőrzési kísérlet. Várj ${rateLimit.retryAfterSeconds} másodpercet.` },
        { status: 429 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "A PayPal tranzakció-azonosító (orderId) megadása kötelező." },
        { status: 400 }
      );
    }

    // Strict server-side verification against PayPal & DB replay check
    const result = await verifyAndProcessPayPalOrder({
      orderId,
      userId: targetUserId,
      req,
    });

    if (!result.verified) {
      return NextResponse.json(
        {
          error: result.error || "A fizetés hitelesítése sikertelen.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "A PayPal $1-os támogatás sikeresen ellenőrizve és jóváírva! A fiókod mostantól SUPERUSER rangú, minden prémium jogosultsággal.",
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      userRole: "superuser",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Hiba történt a fizetés hitelesítésekor." },
      { status: err.statusCode || 500 }
    );
  }
}
