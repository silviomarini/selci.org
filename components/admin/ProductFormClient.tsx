"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Collection, Product } from "@/lib/shop-types";

type Status = { type: "idle" } | { type: "saving" } | { type: "error"; message: string };

export interface ProductFormClientProps {
  itemId?: string;
  existing: Product | null;
  listUrl: string;
  categories: Category[];
  collections: Collection[];
}

export function ProductFormClient({ itemId, existing, listUrl, categories, collections }: ProductFormClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [images, setImages] = useState<string[]>(existing?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !itemId) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/admin/products/${itemId}/images`, { method: "POST", body: formData });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setStatus({ type: "error", message: json.error ?? "Upload fallito" });
      return;
    }
    const { url } = await res.json();
    setImages((prev) => [...prev, url]);
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((i) => i !== url));
  }

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
      category_id: String(formData.get("category_id") ?? "") || null,
      collection_id: String(formData.get("collection_id") ?? "") || null,
      status: String(formData.get("status") ?? "draft"),
      sort_order: Number(formData.get("sort_order") ?? 0),
      images,
    };

    const url = itemId ? `/api/admin/products/${itemId}` : "/api/admin/products";
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

    if (itemId) {
      setStatus({ type: "idle" });
      router.refresh();
    } else {
      const created = await res.json();
      router.push(`${listUrl}/${created.id}`);
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!itemId) return;
    if (!confirm("Eliminare definitivamente questo prodotto e le sue varianti?")) return;
    setStatus({ type: "saving" });
    const res = await fetch(`/api/admin/products/${itemId}`, { method: "DELETE" });
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
      <h1>{itemId ? "Modifica prodotto" : "Nuovo prodotto"}</h1>

      <div className="admin-form-row">
        <label htmlFor="name">Nome</label>
        <input id="name" name="name" defaultValue={existing?.name} required />
      </div>

      <div className="admin-form-row">
        <label htmlFor="slug">Slug</label>
        <input id="slug" name="slug" defaultValue={existing?.slug} placeholder="es. giacca-verde-selvatica" />
        <p className="admin-form-hint">Usato nell&apos;URL pubblico (/prodotto/slug).</p>
      </div>

      <div className="admin-form-row">
        <label htmlFor="description">Descrizione</label>
        <textarea id="description" name="description" rows={5} defaultValue={existing?.description ?? ""} />
      </div>

      <div className="admin-form-row--split">
        <div className="admin-form-row">
          <label htmlFor="category_id">Categoria</label>
          <select id="category_id" name="category_id" defaultValue={existing?.category_id ?? ""}>
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-form-row">
          <label htmlFor="collection_id">Collezione</label>
          <select id="collection_id" name="collection_id" defaultValue={existing?.collection_id ?? ""}>
            <option value="">—</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

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

      <div className="admin-form-row">
        <label>Immagini</label>
        <div className="admin-image-list">
          {images.map((url) => (
            <div className="admin-image-thumb" key={url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" />
              <button type="button" onClick={() => removeImage(url)} aria-label="Rimuovi">
                ✕
              </button>
            </div>
          ))}
        </div>
        {itemId ? (
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
        ) : (
          <p className="admin-form-hint">Salva il prodotto per poter caricare le immagini.</p>
        )}
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
            Elimina prodotto
          </button>
        )}
      </div>
    </form>
  );
}
