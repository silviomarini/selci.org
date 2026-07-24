import "server-only";

import { db } from "@/lib/shop-api";
import type { Coupon } from "@/lib/shop-types";

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  coupon?: Coupon;
  discountCents?: number;
}

/** Read-only validation (no redemption) — used by the cart's live coupon check and by checkout before redeem_coupon(). */
export async function validateCoupon(code: string, subtotalCents: number): Promise<CouponValidationResult> {
  const { data: coupon } = await db
    .from("coupons")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (!coupon) return { valid: false, error: "Coupon non valido" };

  const c = coupon as Coupon;
  const now = Date.now();

  if (c.status !== "active") return { valid: false, error: "Coupon non più attivo" };
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return { valid: false, error: "Coupon non ancora valido" };
  if (c.expires_at && new Date(c.expires_at).getTime() < now) return { valid: false, error: "Coupon scaduto" };
  if (c.max_redemptions != null && c.times_redeemed >= c.max_redemptions) {
    return { valid: false, error: "Coupon esaurito" };
  }
  if (c.min_order_cents != null && subtotalCents < c.min_order_cents) {
    return { valid: false, error: `Ordine minimo richiesto: € ${(c.min_order_cents / 100).toFixed(2)}` };
  }

  const discountCents =
    c.discount_type === "percentage"
      ? Math.round((subtotalCents * c.discount_value) / 100)
      : Math.min(c.discount_value, subtotalCents);

  return { valid: true, coupon: c, discountCents };
}

/** Atomic redemption-count increment, guarded the same way as validateCoupon (race-safe). */
export async function redeemCoupon(couponId: string): Promise<boolean> {
  const { data, error } = await db.rpc("redeem_coupon", { p_coupon_id: couponId });
  if (error) throw new Error(error.message);
  return Boolean(data);
}

/** Mirror of releaseCartStock — called when a checkout session expires/is cancelled before payment. */
export async function releaseCoupon(couponId: string): Promise<void> {
  const { error } = await db.rpc("release_coupon", { p_coupon_id: couponId });
  if (error) throw new Error(error.message);
}
