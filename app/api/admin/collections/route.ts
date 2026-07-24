import { createAdminCollectionHandlers } from "@/lib/admin-crud";

export const { GET, POST } = createAdminCollectionHandlers("collections", "sort_order");
