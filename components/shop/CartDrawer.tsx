"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPriceCents } from "@/lib/format";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotalCents } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountCents: number } | null>(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [closeCart]);

  async function handleApplyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal_cents: subtotalCents }),
      });
      const data = await res.json();
      if (!data.valid) {
        setCouponError(data.error ?? "Coupon non valido");
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({ code: code.toUpperCase(), discountCents: data.discountCents ?? 0 });
    } finally {
      setApplyingCoupon(false);
    }
  }

  async function handleCheckout() {
    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
          coupon_code: appliedCoupon?.code,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Checkout non disponibile");
      }
      window.location.href = data.url;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Errore durante il checkout");
      setCheckingOut(false);
    }
  }

  return (
    <div
      className={`modal-overlay drawer-overlay${isOpen ? " open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Carrello"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeCart();
      }}
    >
      <div className="modal-card drawer-card">
        <button className="modal-close" aria-label="Chiudi carrello" onClick={closeCart}>
          &#x2715;
        </button>

        <p className="modal-tag">Il tuo carrello</p>

        {items.length === 0 ? (
          <p className="modal-text">Il carrello è vuoto.</p>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", margin: "1.5rem 0", flex: 1, overflowY: "auto" }}>
              {items.map((item) => (
                <div key={item.variantId} style={{ display: "flex", gap: "0.9rem" }}>
                  <div style={{ width: 64, height: 80, flexShrink: 0, background: "var(--sand)", overflow: "hidden" }}>
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="product-name" style={{ fontSize: "1rem" }}>
                      {item.name}
                    </p>
                    <p className="product-sub">{item.variantLabel}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.4rem" }}>
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ padding: ".2rem .6rem" }}
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="custodian-mono">{item.quantity}</span>
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ padding: ".2rem .6rem" }}
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxStock}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId)}
                        style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "rgba(20,20,16,.4)", fontSize: ".75rem" }}
                      >
                        Rimuovi
                      </button>
                    </div>
                  </div>
                  <p className="custodian-mono">{formatPriceCents(item.priceCents * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="modal-rule" style={{ margin: "0 0 1rem" }} />

            {appliedCoupon ? (
              <p style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: ".85rem", marginBottom: "0.8rem" }}>
                <span>
                  Coupon <strong className="custodian-mono">{appliedCoupon.code}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setAppliedCoupon(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(20,20,16,.4)", fontSize: ".75rem" }}
                >
                  Rimuovi
                </button>
              </p>
            ) : (
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.8rem" }}>
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Codice coupon"
                  style={{
                    flex: 1,
                    padding: ".5rem .7rem",
                    border: "1px solid rgba(42,74,26,.28)",
                    borderRadius: "3px",
                    fontFamily: "var(--sans)",
                    fontSize: ".82rem",
                  }}
                />
                <button type="button" className="btn-outline" onClick={handleApplyCoupon} disabled={applyingCoupon || !couponInput.trim()}>
                  {applyingCoupon ? "…" : "Applica"}
                </button>
              </div>
            )}
            {couponError && (
              <p style={{ fontSize: ".78rem", color: "rgba(160,50,50,.85)", marginBottom: "0.8rem" }}>{couponError}</p>
            )}

            <p style={{ display: "flex", justifyContent: "space-between", fontSize: ".9rem", marginBottom: ".3rem" }}>
              <span>Subtotale</span>
              <span>{formatPriceCents(subtotalCents)}</span>
            </p>
            {appliedCoupon && (
              <p style={{ display: "flex", justifyContent: "space-between", fontSize: ".9rem", marginBottom: ".3rem" }}>
                <span>Sconto</span>
                <span>-{formatPriceCents(appliedCoupon.discountCents)}</span>
              </p>
            )}
            <p style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", marginBottom: "1.2rem" }}>
              <strong>Totale</strong>
              <strong>{formatPriceCents(subtotalCents - (appliedCoupon?.discountCents ?? 0))}</strong>
            </p>
            <p className="admin-form-hint" style={{ marginBottom: "1rem" }}>
              Spedizione calcolata al passo successivo.
            </p>

            {checkoutError && (
              <p className="custodian-banner custodian-banner--danger" role="alert" style={{ marginBottom: "1rem" }}>
                {checkoutError}
              </p>
            )}

            <button type="button" className="modal-cta" style={{ width: "100%", justifyContent: "center" }} onClick={handleCheckout} disabled={checkingOut}>
              {checkingOut ? "Reindirizzamento…" : "Vai al checkout"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
