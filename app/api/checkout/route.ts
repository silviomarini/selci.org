import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/shop-api";
import { validateCoupon, redeemCoupon, releaseCoupon } from "@/lib/coupons";
import { reserveCartStock, releaseCartStock, InsufficientStockError, type CartRpcItem } from "@/lib/stock";
import { createPendingOrder, computeShippingCents } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

const RESERVATION_MINUTES = 30;

interface CartItemInput {
  variant_id: string;
  quantity: number;
}

interface VariantWithProduct {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  price_cents: number;
  status: string;
  products: { name: string; status: string } | { name: string; status: string }[] | null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rawItems: CartItemInput[] = body?.items;
  const couponCode: string | undefined = body?.coupon_code;

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json({ error: "Il carrello è vuoto" }, { status: 400 });
  }
  for (const item of rawItems) {
    if (!item.variant_id || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
    }
  }

  // Dedup: somma le quantità se lo stesso variant_id compare più volte.
  const quantityByVariant = new Map<string, number>();
  for (const item of rawItems) {
    quantityByVariant.set(item.variant_id, (quantityByVariant.get(item.variant_id) ?? 0) + item.quantity);
  }
  const variantIds = Array.from(quantityByVariant.keys());

  const { data: variantRows, error: variantsError } = await db
    .from("product_variants")
    .select("id, sku, size, color, price_cents, status, products(name, status)")
    .in("id", variantIds);

  if (variantsError) {
    return NextResponse.json({ error: "Errore nel caricamento dei prodotti" }, { status: 500 });
  }

  const variants = (variantRows ?? []) as unknown as VariantWithProduct[];
  if (variants.length !== variantIds.length) {
    return NextResponse.json({ error: "Uno o più articoli non sono più disponibili" }, { status: 400 });
  }

  const orderItems = [];
  let subtotalCents = 0;
  for (const variant of variants) {
    const product = Array.isArray(variant.products) ? variant.products[0] : variant.products;
    if (variant.status !== "active" || !product || product.status !== "active") {
      return NextResponse.json({ error: "Uno o più articoli non sono più disponibili" }, { status: 400 });
    }
    const quantity = quantityByVariant.get(variant.id)!;
    const variantLabel = [variant.size, variant.color].filter(Boolean).join(" / ") || "Unica";
    orderItems.push({
      variant_id: variant.id,
      product_name: product.name,
      variant_label: variantLabel,
      unit_price_cents: variant.price_cents,
      quantity,
    });
    subtotalCents += variant.price_cents * quantity;
  }

  let discountCents = 0;
  let couponId: string | undefined;
  if (couponCode) {
    const result = await validateCoupon(couponCode, subtotalCents);
    if (!result.valid || !result.coupon) {
      return NextResponse.json({ error: result.error ?? "Coupon non valido" }, { status: 400 });
    }
    discountCents = result.discountCents ?? 0;
    couponId = result.coupon.id;
  }

  const shippingCents = computeShippingCents(subtotalCents - discountCents);
  const totalCents = subtotalCents - discountCents + shippingCents;

  const stockItems: CartRpcItem[] = orderItems.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity }));

  try {
    await reserveCartStock(stockItems);
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ error: "Uno o più articoli non hanno più scorte sufficienti" }, { status: 409 });
    }
    throw err;
  }

  if (couponId) {
    const redeemed = await redeemCoupon(couponId);
    if (!redeemed) {
      await releaseCartStock(stockItems);
      return NextResponse.json({ error: "Il coupon non è più disponibile" }, { status: 409 });
    }
  }

  try {
    const order = await createPendingOrder({
      subtotalCents,
      discountCents,
      shippingCents,
      totalCents,
      couponId,
      items: orderItems,
      expiresInMinutes: RESERVATION_MINUTES,
    });

    const lineItems: Array<{
      price_data: { currency: string; product_data: { name: string }; unit_amount: number };
      quantity: number;
    }> = orderItems.map((item) => ({
      price_data: {
        currency: "eur",
        product_data: { name: `${item.product_name} — ${item.variant_label}` },
        unit_amount: item.unit_price_cents,
      },
      quantity: item.quantity,
    }));

    if (shippingCents > 0) {
      lineItems.push({
        price_data: { currency: "eur", product_data: { name: "Spedizione" }, unit_amount: shippingCents },
        quantity: 1,
      });
    }

    let discounts: Array<{ coupon: string }> | undefined;
    if (discountCents > 0) {
      const stripeCoupon = await getStripe().coupons.create({
        amount_off: discountCents,
        currency: "eur",
        duration: "once",
      });
      discounts = [{ coupon: stripeCoupon.id }];
    }

    const origin = req.nextUrl.origin;
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      discounts,
      shipping_address_collection: { allowed_countries: ["IT"] },
      success_url: `${origin}/checkout/successo?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/annullato`,
      expires_at: Math.floor(Date.now() / 1000) + RESERVATION_MINUTES * 60,
      metadata: { order_id: order.id },
    });

    await db.from("orders").update({ stripe_checkout_session_id: session.id }).eq("id", order.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Rollback: la sessione Stripe non è stata creata (o l'ordine non è stato salvato) — libera riserva e coupon.
    await releaseCartStock(stockItems).catch(() => {});
    if (couponId) await releaseCoupon(couponId).catch(() => {});
    console.error("POST /api/checkout error:", err);
    return NextResponse.json({ error: "Checkout non disponibile, riprova" }, { status: 500 });
  }
}
