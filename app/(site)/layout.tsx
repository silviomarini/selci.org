import { CartProvider } from "@/lib/cart";
import { SiteNav } from "@/components/shop/SiteNav";
import { SiteFooter } from "@/components/shop/SiteFooter";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { SiteScrollEffects } from "@/components/shop/SiteScrollEffects";

// Chrome condiviso da tutte le pagine del negozio (home, prodotto, ecc.):
// stesso wrapper .selci-site, stessa nav/footer, un solo carrello persistente
// tra le navigazioni client-side.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="selci-site">
      <CartProvider>
        <SiteScrollEffects />
        <SiteNav />
        {children}
        <SiteFooter />
        <CartDrawer />
      </CartProvider>
    </div>
  );
}
