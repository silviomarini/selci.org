import { db } from "@/lib/shop-api";
import { formatPriceCents } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/shop-types";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;

  let order: Order | null = null;
  let items: OrderItem[] = [];

  if (sessionId) {
    const { data } = await db.from("orders").select("*").eq("stripe_checkout_session_id", sessionId).single();
    order = (data as Order | null) ?? null;
    if (order) {
      const { data: itemRows } = await db.from("order_items").select("*").eq("order_id", order.id);
      items = (itemRows ?? []) as OrderItem[];
    }
  }

  return (
    <section className="waitlist" style={{ paddingTop: "8rem" }}>
      <div className="waitlist-inner">
        {!order ? (
          <>
            <p className="section-tag">Checkout</p>
            <h1 className="section-title">
              Stiamo <em>verificando.</em>
            </h1>
            <p className="waitlist-desc">
              Il pagamento è in elaborazione. Se hai appena completato l&apos;acquisto, riceverai a breve un&apos;email di
              conferma.
            </p>
          </>
        ) : (
          <>
            <p className="section-tag">Ordine {order.order_number}</p>
            <h1 className="section-title">
              Grazie per
              <br />
              <em>il tuo ordine.</em>
            </h1>
            <div className="rule" style={{ margin: "1.4rem auto" }} />
            <p className="waitlist-desc">
              {order.status === "paid"
                ? "Abbiamo ricevuto il pagamento — ti scriveremo appena l'ordine sarà spedito."
                : "Stiamo confermando il pagamento — riceverai un'email a breve."}
            </p>

            <div style={{ textAlign: "left", maxWidth: 420, margin: "0 auto" }}>
              {items.map((item) => (
                <p key={item.id} className="product-sub" style={{ marginBottom: ".5rem" }}>
                  {item.quantity}&times; {item.product_name} ({item.variant_label}) —{" "}
                  {formatPriceCents(item.line_total_cents)}
                </p>
              ))}
              <p style={{ marginTop: "1rem", fontSize: "1rem" }}>
                <strong>Totale: {formatPriceCents(order.total_cents)}</strong>
              </p>
            </div>
          </>
        )}

        <a href="/" className="btn-solid" style={{ marginTop: "2rem", alignSelf: "center" }}>
          Torna alla home <span className="arr">&#x2192;</span>
        </a>
      </div>
    </section>
  );
}
