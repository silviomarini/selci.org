import "server-only";

import { db } from "@/lib/shop-api";

// Spedizione flat-rate — v1 non integra corrieri/tariffe live (vedi piano, scope-cut deliberato).
export const SHIPPING_FLAT_CENTS = 500;
export const FREE_SHIPPING_THRESHOLD_CENTS = 8000;

export function computeShippingCents(amountAfterDiscountCents: number): number {
  return amountAfterDiscountCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_FLAT_CENTS;
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const suffix = Date.now().toString(36).toUpperCase();
  return `SEL-${year}-${suffix}`;
}

export interface PendingOrderItem {
  variant_id: string;
  product_name: string;
  variant_label: string;
  unit_price_cents: number;
  quantity: number;
}

export interface CreatePendingOrderInput {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  couponId?: string | null;
  items: PendingOrderItem[];
  expiresInMinutes: number;
}

/** Creates the order in 'pending' status with an empty email — the webhook fills it in from Stripe's collected checkout details once paid. */
export async function createPendingOrder(input: CreatePendingOrderInput) {
  const expiresAt = new Date(Date.now() + input.expiresInMinutes * 60_000).toISOString();

  const { data: order, error } = await db
    .from("orders")
    .insert({
      order_number: generateOrderNumber(),
      email: "",
      status: "pending",
      subtotal_cents: input.subtotalCents,
      discount_cents: input.discountCents,
      shipping_cents: input.shippingCents,
      total_cents: input.totalCents,
      coupon_id: input.couponId ?? null,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error || !order) throw new Error(error?.message ?? "Creazione ordine fallita");

  const { error: itemsError } = await db.from("order_items").insert(
    input.items.map((item) => ({
      order_id: order.id,
      variant_id: item.variant_id,
      product_name: item.product_name,
      variant_label: item.variant_label,
      unit_price_cents: item.unit_price_cents,
      quantity: item.quantity,
      line_total_cents: item.unit_price_cents * item.quantity,
    }))
  );
  if (itemsError) throw new Error(itemsError.message);

  return order;
}
