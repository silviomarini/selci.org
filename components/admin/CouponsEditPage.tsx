import { db } from "@/lib/shop-api";
import type { CustodianEditModuleProps } from "@silviomarini/custodian";
import type { Coupon } from "@/lib/shop-types";
import { CouponFormClient } from "@/components/admin/CouponFormClient";

export async function CouponsEditPage({ config, itemId }: CustodianEditModuleProps) {
  const existing = itemId
    ? ((await db.from("coupons").select("*").eq("id", itemId).single()).data as Coupon | null)
    : null;

  const basePath = config.basePath ?? "/custodian";

  return (
    <CouponFormClient itemId={itemId} existing={existing} listUrl={`${basePath}/coupon`} apiBasePath="/api/admin/coupons" />
  );
}
