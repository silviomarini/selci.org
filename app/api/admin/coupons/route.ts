import { createAdminCollectionHandlers } from "@/lib/admin-crud";

export const { GET, POST } = createAdminCollectionHandlers("coupons", "created_at");
