import { db } from "@/lib/shop-api";
import type { CustodianModuleProps } from "@silviomarini/custodian";
import type { Category, Collection } from "@/lib/shop-types";

export interface TaxonomyListPageProps extends CustodianModuleProps {
  table: "categories" | "collections";
  route: string;
  label: string;
}

export async function TaxonomyListPage({ config, table, route, label }: TaxonomyListPageProps) {
  const { data, error } = await db.from(table).select("*").order("sort_order");
  const rows = (data ?? []) as (Category | Collection)[];
  const basePath = config.basePath ?? "/custodian";

  return (
    <div>
      <div className="admin-page-header">
        <h1>{label}</h1>
        <a className="admin-button admin-button--primary" href={`${basePath}/${route}/new`}>
          + Nuova voce
        </a>
      </div>

      {error && (
        <p className="custodian-banner custodian-banner--danger" role="alert">
          {error.message}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="admin-empty">Nessuna voce ancora. Creane una per iniziare.</p>
      ) : (
        <div className="custodian-table">
          <table>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Slug</th>
                <th scope="col">Stato</th>
                <th scope="col">Ordine</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td className="custodian-mono">{row.slug}</td>
                  <td>
                    <span
                      className={`custodian-tag ${row.status === "active" ? "custodian-tag--published" : "custodian-tag--draft"}`}
                    >
                      {row.status === "active" ? "Attivo" : row.status === "draft" ? "Bozza" : "Archiviato"}
                    </span>
                  </td>
                  <td className="custodian-mono">{row.sort_order}</td>
                  <td>
                    <a href={`${basePath}/${route}/${row.id}`}>Modifica</a>
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
