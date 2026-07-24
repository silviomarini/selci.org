import { db } from "@/lib/shop-api";
import type { CustodianModuleProps } from "@silviomarini/custodian";
import type { Coupon } from "@/lib/shop-types";

const ROUTE = "coupon";

export async function CouponsListPage({ config }: CustodianModuleProps) {
  const { data, error } = await db.from("coupons").select("*").order("created_at", { ascending: false });
  const rows = (data ?? []) as Coupon[];
  const basePath = config.basePath ?? "/custodian";

  return (
    <div>
      <div className="admin-page-header">
        <h1>Coupon</h1>
        <a className="admin-button admin-button--primary" href={`${basePath}/${ROUTE}/new`}>
          + Nuovo coupon
        </a>
      </div>

      {error && (
        <p className="custodian-banner custodian-banner--danger" role="alert">
          {error.message}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="admin-empty">Nessun coupon ancora. Creane uno per iniziare.</p>
      ) : (
        <div className="custodian-table">
          <table>
            <thead>
              <tr>
                <th scope="col">Codice</th>
                <th scope="col">Sconto</th>
                <th scope="col">Utilizzi</th>
                <th scope="col">Scadenza</th>
                <th scope="col">Stato</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="custodian-mono">{row.code}</td>
                  <td>
                    {row.discount_type === "percentage" ? `${row.discount_value}%` : `€ ${(row.discount_value / 100).toFixed(2)}`}
                  </td>
                  <td className="custodian-mono">
                    {row.times_redeemed}
                    {row.max_redemptions ? ` / ${row.max_redemptions}` : ""}
                  </td>
                  <td className="custodian-mono">
                    {row.expires_at ? new Date(row.expires_at).toLocaleDateString("it-IT") : "—"}
                  </td>
                  <td>
                    <span className={`custodian-tag ${row.status === "active" ? "custodian-tag--published" : "custodian-tag--draft"}`}>
                      {row.status === "active" ? "Attivo" : "Disattivato"}
                    </span>
                  </td>
                  <td>
                    <a href={`${basePath}/${ROUTE}/${row.id}`}>Modifica</a>
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
