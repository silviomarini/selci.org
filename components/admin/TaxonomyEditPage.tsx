import { db } from "@/lib/shop-api";
import type { CustodianEditModuleProps } from "@silviomarini/custodian";
import type { Category, Collection } from "@/lib/shop-types";
import { TaxonomyFormClient } from "@/components/admin/TaxonomyFormClient";

export interface TaxonomyEditPageProps extends CustodianEditModuleProps {
  table: "categories" | "collections";
  route: string;
  apiBasePath: string;
  withImage: boolean;
}

export async function TaxonomyEditPage({ config, itemId, table, route, apiBasePath, withImage }: TaxonomyEditPageProps) {
  const existing = itemId
    ? ((await db.from(table).select("*").eq("id", itemId).single()).data as (Category | Collection) | null)
    : null;

  const basePath = config.basePath ?? "/custodian";

  return (
    <TaxonomyFormClient
      itemId={itemId}
      existing={existing}
      listUrl={`${basePath}/${route}`}
      apiBasePath={apiBasePath}
      withImage={withImage}
    />
  );
}
