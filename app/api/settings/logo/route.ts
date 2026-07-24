import { createLogoUploadRouteHandler } from "@silviomarini/custodian";
import { db, getAuthContext } from "@/lib/shop-api";

// Admin-only: uploads to the 'custodian-branding' bucket (default), returns its public URL.
export const { POST } = createLogoUploadRouteHandler({
  storage: db.storage,
  getAuthContext,
});
