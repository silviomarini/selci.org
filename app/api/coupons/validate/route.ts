import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupons";

export async function POST(req: NextRequest) {
  const { code, subtotal_cents } = await req.json().catch(() => ({}));

  if (!code || typeof subtotal_cents !== "number") {
    return NextResponse.json({ valid: false, error: "Richiesta non valida" }, { status: 400 });
  }

  const result = await validateCoupon(code, subtotal_cents);

  // Solo il minimo indispensabile all'UI del carrello — mai esporre l'intera
  // riga coupon (times_redeemed, max_redemptions, id, ecc.) a un client anonimo.
  if (!result.valid) {
    return NextResponse.json({ valid: false, error: result.error });
  }
  return NextResponse.json({ valid: true, discountCents: result.discountCents });
}
