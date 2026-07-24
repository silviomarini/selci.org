import type { NextRequest } from "next/server";
import { createLogoUploadRouteHandler } from "@silviomarini/custodian";
import { db, getAuthContext } from "@/lib/shop-api";

// Admin-only: uploads to the 'custodian-branding' bucket (default), returns its public URL.
// db.storage is accessed inside the request handler, not at module scope —
// db is a lazily-instantiated client (lib/supabase-lazy.ts), and touching
// db.storage at import time would defeat that during Next.js's build-time
// page-data collection (which imports every route module without a request).
export async function POST(req: NextRequest) {
  const { POST: handler } = createLogoUploadRouteHandler({
    storage: db.storage,
    getAuthContext,
  });
  return handler(req);
}
