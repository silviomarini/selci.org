import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "@silviomarini/auth";
import { checkAdminAccess } from "@silviomarini/custodian";
import type { NextRequest } from "next/server";
import { custodianApp } from "@/lib/custodian";

/**
 * Service-role client: every admin route is already gated by
 * middleware/getAuthContext, so shop CRUD runs with full DB access rather
 * than the signed-in user's RLS policies (same pattern as the blog CMS).
 */
export const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getAuthContext(req: NextRequest) {
  const session = await getServerSession(req, {
    supabaseUrl: custodianApp.config.supabaseUrl,
    supabaseAnonKey: custodianApp.config.supabaseAnonKey,
  });
  return { isAdmin: checkAdminAccess(session, custodianApp.config) };
}
