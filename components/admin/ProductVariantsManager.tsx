"use client";

import { useState } from "react";
import type { ProductVariant } from "@/lib/shop-types";

type Status = { type: "idle" } | { type: "saving" } | { type: "error"; message: string };

const emptyDraft = { sku: "", size: "", color: "", price_cents: "", compare_at_price_cents: "", stock: "0" };

export function ProductVariantsManager({ productId, initial }: { productId: string; initial: ProductVariant[] }) {
  const [variants, setVariants] = useState<ProductVariant[]>(initial);
  const [draft, setDraft] = useState(emptyDraft);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function refresh() {
    const res = await fetch(`/api/admin/products/${productId}/variants`);
    if (res.ok) setVariants(await res.json());
  }

  async function handleAdd() {
    if (!draft.sku.trim() || !draft.price_cents) {
      setStatus({ type: "error", message: "SKU e prezzo sono obbligatori." });
      return;
    }
    setStatus({ type: "saving" });
    const res = await fetch(`/api/admin/products/${productId}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: draft.sku.trim(),
        size: draft.size.trim() || null,
        color: draft.color.trim() || null,
        price_cents: Math.round(Number(draft.price_cents) * 100),
        compare_at_price_cents: draft.compare_at_price_cents ? Math.round(Number(draft.compare_at_price_cents) * 100) : null,
        stock: Number(draft.stock || 0),
      }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setStatus({ type: "error", message: json.error ?? "Creazione variante fallita" });
      return;
    }
    setDraft(emptyDraft);
    setStatus({ type: "idle" });
    await refresh();
  }

  async function handleUpdate(variant: ProductVariant, patch: Partial<ProductVariant>) {
    setStatus({ type: "saving" });
    const res = await fetch(`/api/admin/products/${productId}/variants/${variant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setStatus({ type: "error", message: json.error ?? "Aggiornamento fallito" });
      return;
    }
    setStatus({ type: "idle" });
    await refresh();
  }

  async function handleDelete(variant: ProductVariant) {
    if (!confirm(`Eliminare la variante ${variant.sku}?`)) return;
    setStatus({ type: "saving" });
    const res = await fetch(`/api/admin/products/${productId}/variants/${variant.id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setStatus({ type: "error", message: json.error ?? "Eliminazione fallita" });
      return;
    }
    setStatus({ type: "idle" });
    await refresh();
  }

  return (
    <div className="admin-variants-section">
      <h2>Varianti (taglia / colore)</h2>

      {variants.map((variant) => (
        <div className="admin-variant-row" key={variant.id}>
          <div className="admin-form-row">
            <label>SKU</label>
            <input defaultValue={variant.sku} onBlur={(e) => handleUpdate(variant, { sku: e.target.value })} />
          </div>
          <div className="admin-form-row">
            <label>Taglia</label>
            <input defaultValue={variant.size ?? ""} onBlur={(e) => handleUpdate(variant, { size: e.target.value || null })} />
          </div>
          <div className="admin-form-row">
            <label>Colore</label>
            <input defaultValue={variant.color ?? ""} onBlur={(e) => handleUpdate(variant, { color: e.target.value || null })} />
          </div>
          <div className="admin-form-row">
            <label>Prezzo €</label>
            <input
              type="number"
              step="0.01"
              defaultValue={variant.price_cents / 100}
              onBlur={(e) => handleUpdate(variant, { price_cents: Math.round(Number(e.target.value) * 100) })}
            />
          </div>
          <div className="admin-form-row">
            <label>Stock</label>
            <input
              type="number"
              defaultValue={variant.stock}
              onBlur={(e) => handleUpdate(variant, { stock: Number(e.target.value) })}
            />
          </div>
          <button type="button" className="admin-button admin-button--danger" onClick={() => handleDelete(variant)}>
            Elimina
          </button>
        </div>
      ))}

      <div className="admin-variant-row">
        <div className="admin-form-row">
          <label>SKU</label>
          <input value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} placeholder="es. SEL-TS-M-GRN" />
        </div>
        <div className="admin-form-row">
          <label>Taglia</label>
          <input value={draft.size} onChange={(e) => setDraft({ ...draft, size: e.target.value })} placeholder="M" />
        </div>
        <div className="admin-form-row">
          <label>Colore</label>
          <input value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} placeholder="Verde" />
        </div>
        <div className="admin-form-row">
          <label>Prezzo €</label>
          <input
            type="number"
            step="0.01"
            value={draft.price_cents}
            onChange={(e) => setDraft({ ...draft, price_cents: e.target.value })}
          />
        </div>
        <div className="admin-form-row">
          <label>Stock</label>
          <input type="number" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} />
        </div>
        <button type="button" className="admin-button admin-button--primary" onClick={handleAdd} disabled={status.type === "saving"}>
          + Aggiungi
        </button>
      </div>

      {status.type === "error" && (
        <p className="custodian-banner custodian-banner--danger" role="alert">
          {status.message}
        </p>
      )}
    </div>
  );
}
