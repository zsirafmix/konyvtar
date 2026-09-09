import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await req.json().catch(() => ({}));
    const userEmail = (user?.email || body?.userEmail || "").trim();

    // Unique transaction/order tracking ID
    const trackingId = `PP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Host / origin detection
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("host") || "konyvtar-faky.onrender.com";
    const origin = `${protocol}://${host}`;

    const returnUrl = body?.returnUrl || `${origin}/supporter?status=success&orderId=${trackingId}`;
    const cancelUrl = body?.cancelUrl || `${origin}/supporter?status=cancel`;

    const receiverEmail = (process.env.PAYPAL_RECEIVER_EMAIL || "1000zsiraf@gmail.com").trim();

    // Construct PayPal Webscr payment parameters
    // Brand name and item name represent "Librarian AI"
    const params = new URLSearchParams({
      cmd: "_xclick",
      business: receiverEmail,
      item_name: "Librarian AI - 1$ Superuser Tagság",
      item_number: "SUPERUSER_1USD",
      amount: "1.00",
      currency_code: "USD",
      no_shipping: "1",
      no_note: "1",
      custom: userEmail || user?.id || "anonymous",
      return: returnUrl,
      cancel_return: cancelUrl,
      rm: "2",
    });

    const paypalCheckoutUrl = `https://www.paypal.com/cgi-bin/webscr?${params.toString()}`;

    return NextResponse.json({
      success: true,
      url: paypalCheckoutUrl,
      orderId: trackingId,
      userEmail,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Nem sikerült a PayPal fizetést előkészíteni: " + err.message },
      { status: 500 }
    );
  }
}
