import { createAdminItemHandlers } from "@/lib/admin-crud";

export const { GET, PATCH, DELETE } = createAdminItemHandlers("products");
