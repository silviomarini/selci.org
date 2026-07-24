import { createAdminCollectionHandlers } from "@/lib/admin-crud";

export const { GET, POST } = createAdminCollectionHandlers("categories", "sort_order");
