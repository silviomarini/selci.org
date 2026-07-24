"use client";

import { useState } from "react";
import type { ProductCardData } from "@/lib/shop-types";
import { formatPriceCents } from "@/lib/format";

const LIMIT = 8;

export function ProductGrid({
  initialProducts,
  initialHasMore,
}: {
  initialProducts: ProductCardData[];
  initialHasMore: boolean;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?offset=${products.length}&limit=${LIMIT}`);
      const data = await res.json();
      if (res.ok) {
        setProducts((prev) => [...prev, ...data.products]);
        setHasMore(data.hasMore);
      }
    } finally {
      setLoading(false);
    }
  }

  if (products.length === 0) {
    return <p className="empty-note">Nuovi prodotti in arrivo — iscriviti alla lista d&apos;attesa per essere avvisato.</p>;
  }

  return (
    <>
      <div className="products-grid">
        {products.map((product, i) => (
          <a
            key={product.id}
            href={`/prodotto/${product.slug}`}
            className={`product-card reveal delay-${(i % 3) + 1}`}
          >
            <div className="product-card-img">
              {product.image && <img src={product.image} alt={product.name} loading="lazy" />}
              <div className="product-overlay">
                <span>Scopri &rarr;</span>
              </div>
              {product.compare_at_price_cents && <div className="product-badge sale">Offerta</div>}
              {!product.in_stock && <div className="product-badge">Esaurito</div>}
            </div>
            <div className="product-info">
              <p className="product-name">{product.name}</p>
              <p className="product-price">
                {formatPriceCents(product.price_cents)}
                {product.compare_at_price_cents && (
                  <span className="compare-at">{formatPriceCents(product.compare_at_price_cents)}</span>
                )}
              </p>
            </div>
          </a>
        ))}
      </div>

      {hasMore && (
        <div className="load-more-wrap">
          <button type="button" className="btn-outline" onClick={loadMore} disabled={loading}>
            {loading ? "Caricamento…" : "Carica altri"}
          </button>
        </div>
      )}
    </>
  );
}
