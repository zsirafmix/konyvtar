import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { verifyAndProcessPayPalOrder } from "@/lib/payments/paypal";
import { checkRateLimit, RATE_LIMIT_CONFIGS, getClientIp } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    // Rate limit payment verifications
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit({
      identifier: `pay_verify:${user.id || ip}`,
      windowMs: RATE_LIMIT_CONFIGS.paymentVerify.windowMs,
      maxRequests: RATE_LIMIT_CONFIGS.paymentVerify.maxRequests,
    });

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Túl sok ellenőrzési kísérlet. Várj ${rateLimit.retryAfterSeconds} másodpercet.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "A PayPal tranzakció-azonosító (orderId) megadása kötelező." },
        { status: 400 }
      );
    }

    // Strict server-side verification against PayPal & DB replay check
    const result = await verifyAndProcessPayPalOrder({
      orderId,
      userId: user.id,
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
