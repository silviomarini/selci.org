import { notFound } from "next/navigation";
import { db } from "@/lib/shop-api";
import type { CustodianEditModuleProps } from "@silviomarini/custodian";
import type { Order, OrderItem } from "@/lib/shop-types";
import { formatPriceCents } from "@/lib/format";
import { OrderStatusFormClient } from "@/components/admin/OrderStatusFormClient";

export async function OrdersEditPage({ itemId }: CustodianEditModuleProps) {
  if (!itemId) notFound();

  const { data: order } = await db.from("orders").select("*").eq("id", itemId).single();
  if (!order) notFound();

  const { data: items } = await db.from("order_items").select("*").eq("order_id", itemId);
  const typedOrder = order as Order;
  const typedItems = (items ?? []) as OrderItem[];

  return (
    <div>
      <div className="admin-page-header">
        <h1>Ordine {typedOrder.order_number}</h1>
      </div>

      <p>
        <strong>{typedOrder.email}</strong>
        <br />
        Creato il {new Date(typedOrder.created_at).toLocaleString("it-IT")}
        {typedOrder.paid_at && <> &middot; pagato il {new Date(typedOrder.paid_at).toLocaleString("it-IT")}</>}
      </p>

      <table className="admin-order-items">
        <thead>
          <tr>
            <th>Articolo</th>
            <th>Variante</th>
            <th>Qtà</th>
            <th>Prezzo unit.</th>
            <th>Totale</th>
          </tr>
        </thead>
        <tbody>
          {typedItems.map((item) => (
            <tr key={item.id}>
              <td>{item.product_name}</td>
              <td>{item.variant_label}</td>
              <td className="custodian-mono">{item.quantity}</td>
              <td className="custodian-mono">{formatPriceCents(item.unit_price_cents)}</td>
              <td className="custodian-mono">{formatPriceCents(item.line_total_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: "1rem" }}>
        Subtotale: {formatPriceCents(typedOrder.subtotal_cents)}
        <br />
        Sconto: -{formatPriceCents(typedOrder.discount_cents)}
        <br />
        Spedizione: {formatPriceCents(typedOrder.shipping_cents)}
        <br />
        <strong>Totale: {formatPriceCents(typedOrder.total_cents)}</strong>
      </p>

      <div className="admin-variants-section">
        <h2>Stato ordine</h2>
        <OrderStatusFormClient
          orderId={typedOrder.id}
          currentStatus={typedOrder.status}
          canEdit={typedOrder.status !== "pending"}
        />
      </div>
    </div>
  );
}
