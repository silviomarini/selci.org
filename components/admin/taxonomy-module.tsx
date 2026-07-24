import type { CustodianModule, CustodianModuleProps, CustodianEditModuleProps } from "@silviomarini/custodian";
import { TaxonomyListPage } from "@/components/admin/TaxonomyListPage";
import { TaxonomyEditPage } from "@/components/admin/TaxonomyEditPage";

interface TaxonomyModuleOptions {
  id: string;
  label: string;
  route: string;
  table: "categories" | "collections";
  apiBasePath: string;
  withImage?: boolean;
}

/** Categorie e Collezioni condividono lo stesso schema (slug/nome/descrizione/
 * stato/ordine, +immagine per le collezioni) — un'unica implementazione,
 * due moduli custodian registrati con parametri diversi. */
export function createTaxonomyModule(options: TaxonomyModuleOptions): CustodianModule {
  function List(props: CustodianModuleProps) {
    return (
      <TaxonomyListPage {...props} table={options.table} route={options.route} label={options.label} />
    );
  }

  function Edit(props: CustodianEditModuleProps) {
    return (
      <TaxonomyEditPage
        {...props}
        table={options.table}
        route={options.route}
        apiBasePath={options.apiBasePath}
        withImage={options.withImage ?? false}
      />
    );
  }

  return {
    id: options.id,
    label: options.label,
    route: options.route,
    listComponent: List,
    editComponent: Edit,
  };
}
