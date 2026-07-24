"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/lib/shop-types";

type Status = { type: "idle" } | { type: "saving" } | { type: "error"; message: string };

const EDITABLE_STATUSES: OrderStatus[] = ["fulfilled", "cancelled", "refunded"];

export function OrderStatusFormClient({
  orderId,
  currentStatus,
  canEdit,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState<OrderStatus>(canEdit ? currentStatus : currentStatus);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  if (!canEdit) {
    return (
      <p className="admin-form-hint">
        Lo stato si può aggiornare solo dopo il pagamento (ordine attualmente: {currentStatus}).
      </p>
    );
  }

  async function handleSave() {
    setStatus({ type: "saving" });
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setStatus({ type: "error", message: json.error ?? "Aggiornamento fallito" });
      return;
    }
    setStatus({ type: "idle" });
    router.refresh();
  }

  return (
    <div className="admin-form-row" style={{ maxWidth: 280 }}>
      <label htmlFor="order-status">Stato</label>
      <select id="order-status" value={value} onChange={(e) => setValue(e.target.value as OrderStatus)}>
        {EDITABLE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {status.type === "error" && (
        <p className="custodian-banner custodian-banner--danger" role="alert">
          {status.message}
        </p>
      )}
      <div className="admin-actions">
        <button
          type="button"
          className="admin-button admin-button--primary"
          onClick={handleSave}
          disabled={status.type === "saving"}
        >
          {status.type === "saving" ? "Salvataggio…" : "Aggiorna stato"}
        </button>
      </div>
    </div>
  );
}
