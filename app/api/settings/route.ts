import { createSettingsRouteHandlers } from "@silviomarini/custodian";
import { db, getAuthContext } from "@/lib/shop-api";

// GET: public branding read (needed on the login screen too). PATCH: admin-only.
export const { GET, PATCH } = createSettingsRouteHandlers({ db, getAuthContext });
