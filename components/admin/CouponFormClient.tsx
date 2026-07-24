"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Coupon } from "@/lib/shop-types";

type Status = { type: "idle" } | { type: "saving" } | { type: "error"; message: string };

function toInputDateTime(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 16);
}

export interface CouponFormClientProps {
  itemId?: string;
  existing: Coupon | null;
  listUrl: string;
  apiBasePath: string;
}

export function CouponFormClient({ itemId, existing, listUrl, apiBasePath }: CouponFormClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = String(formData.get("code") ?? "").trim().toUpperCase();
    if (!code) {
      setStatus({ type: "error", message: "Il codice è obbligatorio." });
      return;
    }

    setStatus({ type: "saving" });

    const discountType = String(formData.get("discount_type") ?? "percentage");
    const rawValue = Number(formData.get("discount_value") ?? 0);
    const minOrder = formData.get("min_order_cents");
    const maxRedemptions = formData.get("max_redemptions");
    const startsAt = String(formData.get("starts_at") ?? "");
    const expiresAt = String(formData.get("expires_at") ?? "");

    const body: Record<string, unknown> = {
      code,
      discount_type: discountType,
      discount_value: discountType === "fixed" ? Math.round(rawValue * 100) : rawValue,
      min_order_cents: minOrder ? Math.round(Number(minOrder) * 100) : null,
      max_redemptions: maxRedemptions ? Number(maxRedemptions) : null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      status: String(formData.get("status") ?? "active"),
    };

    const url = itemId ? `${apiBasePath}/${itemId}` : apiBasePath;
    const method = itemId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setStatus({ type: "error", message: json.error ?? `Salvataggio fallito (${res.status})` });
      return;
    }

    router.push(listUrl);
    router.refresh();
  }

  async function handleDelete() {
    if (!itemId) return;
    if (!confirm("Eliminare definitivamente questo coupon?")) return;
    setStatus({ type: "saving" });
    const res = await fetch(`${apiBasePath}/${itemId}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setStatus({ type: "error", message: json.error ?? "Eliminazione fallita" });
      return;
    }
    router.push(listUrl);
    router.refresh();
  }

  const discountValueDisplay =
    existing?.discount_type === "fixed" ? (existing.discount_value / 100).toString() : existing?.discount_value?.toString();

  return (
    <form onSubmit={handleSubmit} className="admin-form" noValidate>
      <h1>{itemId ? "Modifica coupon" : "Nuovo coupon"}</h1>

      <div className="admin-form-row">
        <label htmlFor="code">Codice</label>
        <input id="code" name="code" defaultValue={existing?.code} required style={{ textTransform: "uppercase" }} />
      </div>

      <div className="admin-form-row--split">
        <div className="admin-form-row">
          <label htmlFor="discount_type">Tipo sconto</label>
          <select id="discount_type" name="discount_type" defaultValue={existing?.discount_type ?? "percentage"}>
            <option value="percentage">Percentuale</option>
            <option value="fixed">Importo fisso (€)</option>
          </select>
        </div>
        <div className="admin-form-row">
          <label htmlFor="discount_value">Valore (% o €)</label>
          <input id="discount_value" name="discount_value" type="number" step="0.01" defaultValue={discountValueDisplay} required />
        </div>
      </div>

      <div className="admin-form-row--split">
        <div className="admin-form-row">
          <label htmlFor="min_order_cents">Ordine minimo (€)</label>
          <input
            id="min_order_cents"
            name="min_order_cents"
            type="number"
            step="0.01"
            defaultValue={existing?.min_order_cents ? existing.min_order_cents / 100 : ""}
          />
        </div>
        <div className="admin-form-row">
          <label htmlFor="max_redemptions">Utilizzi massimi</label>
          <input id="max_redemptions" name="max_redemptions" type="number" defaultValue={existing?.max_redemptions ?? ""} />
        </div>
      </div>

      <div className="admin-form-row--split">
        <div className="admin-form-row">
          <label htmlFor="starts_at">Valido dal</label>
          <input id="starts_at" name="starts_at" type="datetime-local" defaultValue={toInputDateTime(existing?.starts_at ?? null)} />
        </div>
        <div className="admin-form-row">
          <label htmlFor="expires_at">Scadenza</label>
          <input id="expires_at" name="expires_at" type="datetime-local" defaultValue={toInputDateTime(existing?.expires_at ?? null)} />
        </div>
      </div>

      <div className="admin-form-row">
        <label htmlFor="status">Stato</label>
        <select id="status" name="status" defaultValue={existing?.status ?? "active"}>
          <option value="active">Attivo</option>
          <option value="disabled">Disattivato</option>
        </select>
      </div>

      {existing && (
        <p className="admin-form-hint">
          Utilizzato {existing.times_redeemed} {existing.times_redeemed === 1 ? "volta" : "volte"}.
        </p>
      )}

      {status.type === "error" && (
        <p className="custodian-banner custodian-banner--danger" role="alert">
          {status.message}
        </p>
      )}

      <div className="admin-actions">
        <button type="submit" className="admin-button admin-button--primary" disabled={status.type === "saving"}>
          {status.type === "saving" ? "Salvataggio…" : "Salva"}
        </button>
        {itemId && (
          <button type="button" className="admin-button admin-button--danger" onClick={handleDelete}>
            Elimina
          </button>
        )}
      </div>
    </form>
  );
}
