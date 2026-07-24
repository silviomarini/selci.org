import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/shop-api";
import { releaseCartStock, type CartRpcItem } from "@/lib/stock";
import { releaseCoupon } from "@/lib/coupons";

/**
 * Safety net contro webhook Stripe persi: rilascia le riserve di stock/coupon
 * degli ordini 'pending' la cui finestra di checkout è scaduta. Il webhook
 * checkout.session.expired dovrebbe già farlo — questo cron (vedi vercel.json)
 * copre i casi in cui l'evento non arriva mai.
 *
 * Cadenza giornaliera (0 3 * * *): il piano Vercel Hobby permette solo cron
 * con frequenza minima di una volta al giorno (frequenze maggiori falliscono
 * in deploy). Non è un problema di correttezza — il webhook resta il
 * meccanismo primario e agisce entro secondi dalla scadenza della sessione
 * Stripe; questo cron è solo la rete di sicurezza di ultima istanza. Passando
 * al piano Pro si può aumentare la frequenza (es. ogni 15 minuti).
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: expiredOrders, error } = await db
    .from("orders")
    .select("id, coupon_id")
    .eq("status", "pending")
    .lt("expires_at", new Date().toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let released = 0;
  for (const order of expiredOrders ?? []) {
    const { data: items } = await db.from("order_items").select("variant_id, quantity").eq("order_id", order.id);
    const stockItems: CartRpcItem[] = (items ?? [])
      .filter((i) => i.variant_id)
      .map((i) => ({ variant_id: i.variant_id as string, quantity: i.quantity }));

    await releaseCartStock(stockItems);
    if (order.coupon_id) await releaseCoupon(order.coupon_id);
    await db.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    released++;
  }

  return NextResponse.json({ released });
}
