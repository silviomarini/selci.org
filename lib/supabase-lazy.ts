import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Defers createClient() until the client is actually used (first property
 * access), not at module import time. Next.js's build-time "collecting page
 * data" step imports every route module without invoking its handlers — a
 * top-level createClient() call would throw "supabaseUrl is required" there
 * if the env var isn't resolved yet in that build phase (same class of bug
 * fixed for the Stripe client in lib/stripe.ts).
 */
export function createLazySupabaseClient(getUrl: () => string, getKey: () => string): SupabaseClient {
  let instance: SupabaseClient | null = null;
  function resolve(): SupabaseClient {
    if (!instance) instance = createClient(getUrl(), getKey());
    return instance;
  }
  return new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
      return Reflect.get(resolve(), prop, receiver);
    },
  });
}
