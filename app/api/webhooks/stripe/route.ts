import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/shop-api";
import { commitCartStock, releaseCartStock, type CartRpcItem } from "@/lib/stock";
import { releaseCoupon } from "@/lib/coupons";
import { sendEmail } from "@/lib/resend";
import { buildOrderConfirmationEmail } from "@/lib/order-email";
import type { Order, OrderItem } from "@/lib/shop-types";

async function getOrderWithItems(orderId: string) {
  const { data: order } = await db.from("orders").select("*").eq("id", orderId).single();
  if (!order) return null;
  const { data: items } = await db.from("order_items").select("*").eq("order_id", orderId);
  return { order: order as Order, items: (items ?? []) as OrderItem[] };
}

async function handleCompleted(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  const result = await getOrderWithItems(orderId);
  if (!result) return;
  const { order, items } = result;
  if (order.status !== "pending") return; // già processato — idempotenza su retry del webhook

  const stockItems: CartRpcItem[] = items.map((i) => ({ variant_id: i.variant_id!, quantity: i.quantity }));
  await commitCartStock(stockItems);

  const email = session.customer_details?.email ?? "";
  const shippingAddress = session.collected_information?.shipping_details?.address ?? session.customer_details?.address ?? null;
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);

  const { data: updated } = await db
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      email,
      shipping_address: shippingAddress,
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq("id", orderId)
    .select()
    .single();

  if (email && updated) {
    await sendEmail({
      to: email,
      subject: `Ordine confermato — ${order.order_number}`,
      html: buildOrderConfirmationEmail(updated as Order, items),
    });
  }
}

async function handleExpiredOrFailed(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  const result = await getOrderWithItems(orderId);
  if (!result) return;
  const { order, items } = result;
  if (order.status !== "pending") return; // già pagato o già rilasciato — niente da fare

  const stockItems: CartRpcItem[] = items.map((i) => ({ variant_id: i.variant_id!, quantity: i.quantity }));
  await releaseCartStock(stockItems);
  if (order.coupon_id) await releaseCoupon(order.coupon_id);

  await db.from("orders").update({ status: "cancelled" }).eq("id", orderId);
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed":
        await handleExpiredOrFailed(event.data.object as Stripe.Checkout.Session);
        break;
    }
  } catch (err) {
    console.error(`Stripe webhook handler error (${event.type}):`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
