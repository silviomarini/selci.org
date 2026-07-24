import PageInteractions from "@/app/PageInteractions";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { listActiveProducts } from "@/lib/shop-db";

// Dinamica per riflettere sempre stock/prezzo correnti, senza dipendere da
// una fetch verso Supabase in fase di build.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Un'interruzione di Supabase non deve abbattere l'intera home (hero,
  // waitlist, brand story non dipendono dai prodotti) — degrada a griglia vuota.
  const { products, hasMore } = await listActiveProducts(0, 8).catch(() => ({ products: [], hasMore: false }));

  return (
    <>
      {/* ═══ HERO ══════════════════════════════════ */}
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Nuova Collezione &mdash; 2026</p>
          <h1 className="hero-title">
            Nati <em>selvatici.</em>
            <br />
            Fatti per
            <br />
            durare.
          </h1>
          <div className="rule" />
          <p className="hero-desc">
            Abbigliamento e accessori nati dalla terra. Design essenziale, materiali naturali, spirito libero.
          </p>
          <a href="#waitlist" className="btn-solid">
            Entra in lista d&apos;attesa
            <span className="arr">&#x2192;</span>
          </a>
        </div>
        <div className="hero-img-wrap">
          <img
            src="/assets/images/cream-collection.png"
            alt="Selci Cream Collection"
            loading="eager"
            fetchPriority="high"
          />
        </div>
      </section>

      {/* ═══ TICKER ════════════════════════════════ */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} style={{ display: "contents" }}>
              <span>Selci</span>
              <span className="dot">&middot;</span>
              <span>Nati Selvatici</span>
              <span className="dot">&middot;</span>
              <span>Fatti per Durare</span>
              <span className="dot">&middot;</span>
              <span>Abbigliamento</span>
              <span className="dot">&middot;</span>
              <span>Accessori</span>
              <span className="dot">&middot;</span>
              <span>Born Wild</span>
              <span className="dot">&middot;</span>
              <span>Made to Last</span>
              <span className="dot">&middot;</span>
            </span>
          ))}
        </div>
      </div>

      {/* ═══ COLLECTION ════════════════════════════ */}
      <section className="collection">
        <div className="section-head reveal">
          <p className="section-tag">La Collezione</p>
          <h2 className="section-title">
            Stile che
            <br />
            <em>parla da solo.</em>
          </h2>
        </div>

        <ProductGrid initialProducts={products} initialHasMore={hasMore} />
      </section>

      {/* ═══ BRAND STORY ═══════════════════════════ */}
      <section className="brand-story">
        <div className="brand-story-img reveal">
          <img src="/assets/images/logo-embroid.png" alt="Logo Selci ricamato su tessuto" loading="lazy" />
        </div>
        <div className="brand-story-content reveal delay-1">
          <p className="section-tag">Il Nostro Spirito</p>
          <h2 className="section-title">
            Selci nasce
            <br />
            dalla <em>terra.</em>
          </h2>
          <p className="brand-story-text">
            I nostri capi nascono per durare: design pulito, colori della natura, qualità che si sente al tatto.
          </p>
          <p className="brand-story-text">Non inseguiamo le tendenze. Creiamo pezzi che restano.</p>
          <div className="stats">
            <div>
              <div className="stat-val">100%</div>
              <div className="stat-label">Materiali naturali</div>
            </div>
            <div>
              <div className="stat-val">SS&thinsp;&apos;26</div>
              <div className="stat-label">Prima collezione</div>
            </div>
            <div>
              <div className="stat-val">&infin;</div>
              <div className="stat-label">Spirito libero</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WAITLIST ══════════════════════════════ */}
      <section className="waitlist" id="waitlist">
        <div className="waitlist-inner">
          <p className="section-tag reveal">Lista d&apos;Attesa</p>
          <h2 className="section-title reveal">
            Sii tra
            <br />i <em>primi.</em>
          </h2>
          <div className="rule reveal" />
          <p className="waitlist-desc reveal">
            La collezione sarà disponibile in edizione limitata. Iscriviti per avere accesso prioritario e ricevere
            aggiornamenti esclusivi sul lancio.
          </p>
          <PageInteractions />
        </div>
      </section>
    </>
  );
}
