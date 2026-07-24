import { createLazySupabaseClient } from "@/lib/supabase-lazy";

/**
 * Anon-key client for public reads — RLS (public_select_active_*) is the
 * real gate here, not this file; using the anon key rather than the
 * service-role one is defense in depth in case a query here ever forgets
 * a `status = 'active'` filter.
 */
export const publicDb = createLazySupabaseClient(
  () => process.env.NEXT_PUBLIC_SUPABASE_URL!,
  () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
