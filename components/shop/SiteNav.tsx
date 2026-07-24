"use client";

import { useCart } from "@/lib/cart";

export function SiteNav() {
  const { count, openCart } = useCart();

  return (
    <nav id="nav">
      <a href="/" className="nav-logo" aria-label="selci home">
        <img src="/assets/images/logo-mark-green.png" alt="" aria-hidden="true" />
        <span className="nav-logo-text">selci</span>
      </a>
      <div className="nav-actions">
        <button type="button" className="cart-toggle" onClick={openCart} aria-label="Apri carrello">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 6h15l-1.5 9h-12z" />
            <path d="M6 6 4.5 2H2" />
            <circle cx="9.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
            <circle cx="17.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
          </svg>
          {count > 0 && <span className="cart-count">{count}</span>}
        </button>
        <a href="/#waitlist" className="btn-pill">
          Lista d&apos;attesa
        </a>
      </div>
    </nav>
  );
}
