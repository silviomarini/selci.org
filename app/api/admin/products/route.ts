import { createAdminCollectionHandlers } from "@/lib/admin-crud";

export const { GET, POST } = createAdminCollectionHandlers("products", "sort_order");
