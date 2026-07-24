"use client";

import { useState } from "react";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="product-gallery">
        <div className="product-gallery-main" />
      </div>
    );
  }

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt={name} />
      </div>
      {images.length > 1 && (
        <div className="product-gallery-thumbs">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`product-gallery-thumb${i === active ? " active" : ""}`}
              onClick={() => setActive(i)}
              aria-label={`Immagine ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
