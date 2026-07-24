"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPriceCents } from "@/lib/format";
import type { ProductVariant } from "@/lib/shop-types";

const MAX_QTY = 10;

function availability(variant: ProductVariant) {
  return variant.stock - variant.reserved;
}

export function VariantSelector({
  productId,
  productSlug,
  productName,
  image,
  variants,
}: {
  productId: string;
  productSlug: string;
  productName: string;
  image: string | null;
  variants: ProductVariant[];
}) {
  const { addItem, openCart } = useCart();

  const sizes = useMemo(() => Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[], [variants]);
  const colors = useMemo(() => Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[], [variants]);

  const firstAvailable = variants.find((v) => availability(v) > 0) ?? variants[0];
  const [selectedSize, setSelectedSize] = useState<string | null>(firstAvailable?.size ?? null);
  const [selectedColor, setSelectedColor] = useState<string | null>(firstAvailable?.color ?? null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedVariant = useMemo(
    () => variants.find((v) => (sizes.length === 0 || v.size === selectedSize) && (colors.length === 0 || v.color === selectedColor)),
    [variants, sizes.length, colors.length, selectedSize, selectedColor]
  );

  const available = selectedVariant ? availability(selectedVariant) : 0;
  const maxQty = Math.max(0, Math.min(available, MAX_QTY));

  function sizeIsAvailable(size: string) {
    return variants.some((v) => v.size === size && (colors.length === 0 || v.color === selectedColor) && availability(v) > 0);
  }
  function colorIsAvailable(color: string) {
    return variants.some((v) => v.color === color && (sizes.length === 0 || v.size === selectedSize) && availability(v) > 0);
  }

  function handleAddToCart() {
    if (!selectedVariant || maxQty === 0) return;
    const variantLabel = [selectedVariant.size, selectedVariant.color].filter(Boolean).join(" / ") || "Unica";
    addItem(
      {
        variantId: selectedVariant.id,
        productId,
        slug: productSlug,
        name: productName,
        variantLabel,
        image: selectedVariant.image_url ?? image,
        priceCents: selectedVariant.price_cents,
        maxStock: availability(selectedVariant),
      },
      quantity
    );
    setAdded(true);
    setQuantity(1);
    openCart();
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div>
      <p className="product-detail-price">
        {selectedVariant ? formatPriceCents(selectedVariant.price_cents) : "—"}
        {selectedVariant?.compare_at_price_cents && (
          <span className="compare-at">{formatPriceCents(selectedVariant.compare_at_price_cents)}</span>
        )}
      </p>

      {sizes.length > 0 && (
        <div className="variant-group">
          <p className="variant-group-label">Taglia</p>
          <div className="variant-options">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                className={`variant-option${selectedSize === size ? " selected" : ""}`}
                disabled={!sizeIsAvailable(size)}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div className="variant-group">
          <p className="variant-group-label">Colore</p>
          <div className="variant-options">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                className={`variant-option${selectedColor === color ? " selected" : ""}`}
                disabled={!colorIsAvailable(color)}
                onClick={() => setSelectedColor(color)}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {!selectedVariant ? (
        <p className="stock-label out">Combinazione non disponibile.</p>
      ) : available <= 0 ? (
        <p className="stock-label out">Esaurito.</p>
      ) : available <= 3 ? (
        <p className="stock-label low">Ultimi {available} pezzi disponibili.</p>
      ) : (
        <p className="stock-label">Disponibile.</p>
      )}

      <div className="qty-stepper">
        <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={maxQty === 0}>
          −
        </button>
        <span className="custodian-mono">{quantity}</span>
        <button type="button" onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty}>
          +
        </button>
      </div>

      <button type="button" className="btn-solid" onClick={handleAddToCart} disabled={maxQty === 0}>
        {added ? "Aggiunto ✓" : "Aggiungi al carrello"}
        {!added && <span className="arr">&#x2192;</span>}
      </button>
    </div>
  );
}
