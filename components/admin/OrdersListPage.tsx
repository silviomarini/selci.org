import { db } from "@/lib/shop-api";
import type { CustodianModuleProps } from "@silviomarini/custodian";
import type { Order } from "@/lib/shop-types";
import { formatPriceCents } from "@/lib/format";

const ROUTE = "ordini";

const STATUS_LABEL: Record<Order["status"], string> = {
  pending: "In attesa",
  paid: "Pagato",
  fulfilled: "Evaso",
  cancelled: "Annullato",
  refunded: "Rimborsato",
};

export async function OrdersListPage({ config }: CustodianModuleProps) {
  const { data, error } = await db
    .from("orders")
    .select("id, order_number, email, status, total_cents, created_at")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as Order[];
  const basePath = config.basePath ?? "/custodian";

  return (
    <div>
      <div className="admin-page-header">
        <h1>Ordini</h1>
      </div>

      {error && (
        <p className="custodian-banner custodian-banner--danger" role="alert">
          {error.message}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="admin-empty">Nessun ordine ancora.</p>
      ) : (
        <div className="custodian-table">
          <table>
            <thead>
              <tr>
                <th scope="col">Ordine</th>
                <th scope="col">Cliente</th>
                <th scope="col">Totale</th>
                <th scope="col">Stato</th>
                <th scope="col">Data</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="custodian-mono">{row.order_number}</td>
                  <td>{row.email}</td>
                  <td className="custodian-mono">{formatPriceCents(row.total_cents)}</td>
                  <td>
                    <span
                      className={`custodian-tag ${
                        row.status === "paid" || row.status === "fulfilled" ? "custodian-tag--published" : "custodian-tag--draft"
                      }`}
                    >
                      {STATUS_LABEL[row.status]}
                    </span>
                  </td>
                  <td className="custodian-mono">{new Date(row.created_at).toLocaleDateString("it-IT")}</td>
                  <td>
                    <a href={`${basePath}/${ROUTE}/${row.id}`}>Dettagli</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
