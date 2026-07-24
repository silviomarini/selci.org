import "server-only";

import { createCustodianApp, type CustodianConfig, type CustodianModule } from "@silviomarini/custodian";
import { createClient } from "@supabase/supabase-js";
import { createTaxonomyModule } from "@/components/admin/taxonomy-module";
import { ProductsListPage } from "@/components/admin/ProductsListPage";
import { ProductsEditPage } from "@/components/admin/ProductsEditPage";
import { CouponsListPage } from "@/components/admin/CouponsListPage";
import { CouponsEditPage } from "@/components/admin/CouponsEditPage";
import { OrdersListPage } from "@/components/admin/OrdersListPage";
import { OrdersEditPage } from "@/components/admin/OrdersEditPage";

const config: CustodianConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean),
  branding: { title: "selci" },
  basePath: "/custodian",
  settingsApiBasePath: "/api/settings",
};

/** Same service-role client as lib/shop-api.ts's `db` — separate export so this file has no circular import on shop-api.ts. */
export function getDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

const modules: CustodianModule[] = [
  {
    id: "products",
    label: "Prodotti",
    route: "prodotti",
    listComponent: ProductsListPage,
    editComponent: ProductsEditPage,
  },
  createTaxonomyModule({
    id: "categories",
    label: "Categorie",
    route: "categorie",
    table: "categories",
    apiBasePath: "/api/admin/categories",
  }),
  createTaxonomyModule({
    id: "collections",
    label: "Collezioni",
    route: "collezioni",
    table: "collections",
    apiBasePath: "/api/admin/collections",
    withImage: true,
  }),
  {
    id: "coupons",
    label: "Coupon",
    route: "coupon",
    listComponent: CouponsListPage,
    editComponent: CouponsEditPage,
  },
  {
    id: "orders",
    label: "Ordini",
    route: "ordini",
    listComponent: OrdersListPage,
    editComponent: OrdersEditPage,
  },
];

export const custodianApp = createCustodianApp(modules, config);
