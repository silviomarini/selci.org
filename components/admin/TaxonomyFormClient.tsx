"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Collection } from "@/lib/shop-types";

type Status = { type: "idle" } | { type: "saving" } | { type: "error"; message: string };

export interface TaxonomyFormClientProps {
  itemId?: string;
  existing: (Category | Collection) | null;
  listUrl: string;
  apiBasePath: string;
  withImage: boolean;
}

export function TaxonomyFormClient({ itemId, existing, listUrl, apiBasePath, withImage }: TaxonomyFormClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ type: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    if (!name) {
      setStatus({ type: "error", message: "Il nome è obbligatorio." });
      return;
    }

    setStatus({ type: "saving" });

    const body: Record<string, unknown> = {
      name,
      slug: String(formData.get("slug") ?? "").trim(),
      description: String(formData.get("description") ?? "") || null,
      status: String(formData.get("status") ?? "draft"),
      sort_order: Number(formData.get("sort_order") ?? 0),
    };
    if (withImage) {
      body.image_url = String(formData.get("image_url") ?? "") || null;
    }

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
    if (!confirm("Eliminare definitivamente questa voce?")) return;
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

  return (
    <form onSubmit={handleSubmit} className="admin-form" noValidate>
      <h1>{itemId ? "Modifica voce" : "Nuova voce"}</h1>

      <div className="admin-form-row">
        <label htmlFor="name">Nome</label>
        <input id="name" name="name" defaultValue={existing?.name} required />
      </div>

      <div className="admin-form-row">
        <label htmlFor="slug">Slug</label>
        <input id="slug" name="slug" defaultValue={existing?.slug} placeholder="es. giacche" />
        <p className="admin-form-hint">Usato nell&apos;URL pubblico — lascia vuoto e verrà richiesto al salvataggio.</p>
      </div>

      <div className="admin-form-row">
        <label htmlFor="description">Descrizione</label>
        <textarea id="description" name="description" defaultValue={existing?.description ?? ""} />
      </div>

      {withImage && (
        <div className="admin-form-row">
          <label htmlFor="image_url">URL immagine</label>
          <input id="image_url" name="image_url" defaultValue={(existing as Collection | null)?.image_url ?? ""} />
        </div>
      )}

      <div className="admin-form-row--split">
        <div className="admin-form-row">
          <label htmlFor="status">Stato</label>
          <select id="status" name="status" defaultValue={existing?.status ?? "draft"}>
            <option value="draft">Bozza</option>
            <option value="active">Attivo</option>
            <option value="archived">Archiviato</option>
          </select>
        </div>
        <div className="admin-form-row">
          <label htmlFor="sort_order">Ordine</label>
          <input id="sort_order" name="sort_order" type="number" defaultValue={existing?.sort_order ?? 0} />
        </div>
      </div>

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
