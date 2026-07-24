import "server-only";

import Stripe from "stripe";

// Costruito al primo utilizzo, non al momento dell'import: eviterebbe che
// l'intera build fallisca se STRIPE_SECRET_KEY non è ancora impostata
// nell'ambiente (es. anteprima locale senza chiavi Stripe configurate).
let instance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!instance) {
    instance = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return instance;
}
