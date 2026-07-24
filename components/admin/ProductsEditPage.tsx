import { db } from "@/lib/shop-api";
import type { CustodianEditModuleProps } from "@silviomarini/custodian";
import type { Category, Collection, Product, ProductVariant } from "@/lib/shop-types";
import { ProductFormClient } from "@/components/admin/ProductFormClient";
import { ProductVariantsManager } from "@/components/admin/ProductVariantsManager";

export async function ProductsEditPage({ config, itemId }: CustodianEditModuleProps) {
  const [existingRes, categoriesRes, collectionsRes, variantsRes] = await Promise.all([
    itemId ? db.from("products").select("*").eq("id", itemId).single() : Promise.resolve({ data: null }),
    db.from("categories").select("*").order("sort_order"),
    db.from("collections").select("*").order("sort_order"),
    itemId
      ? db.from("product_variants").select("*").eq("product_id", itemId).order("created_at")
      : Promise.resolve({ data: [] }),
  ]);

  const basePath = config.basePath ?? "/custodian";

  return (
    <div>
      <ProductFormClient
        itemId={itemId}
        existing={existingRes.data as Product | null}
        listUrl={`${basePath}/prodotti`}
        categories={(categoriesRes.data ?? []) as Category[]}
        collections={(collectionsRes.data ?? []) as Collection[]}
      />
      {itemId && <ProductVariantsManager productId={itemId} initial={(variantsRes.data ?? []) as ProductVariant[]} />}
    </div>
  );
}
