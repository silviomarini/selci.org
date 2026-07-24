import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveProductBySlug } from "@/lib/shop-db";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { VariantSelector } from "@/components/shop/VariantSelector";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getActiveProductBySlug(slug).catch(() => null);
  if (!product) return {};
  return {
    title: `${product.name} — selci`,
    description: product.description ?? undefined,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getActiveProductBySlug(slug).catch(() => null);
  if (!product) notFound();

  const tag = product.collection?.name ?? product.category?.name;

  return (
    <section className="product-detail">
      <ProductGallery images={product.images} name={product.name} />

      <div className="product-detail-info">
        {tag && <p className="section-tag">{tag}</p>}
        <h1 className="product-detail-title">{product.name}</h1>

        <VariantSelector
          productId={product.id}
          productSlug={product.slug}
          productName={product.name}
          image={product.images[0] ?? null}
          variants={product.product_variants}
        />

        {product.description && <div className="product-detail-description">{product.description}</div>}

        <p className="product-detail-meta">Spedizione inclusa in Italia. Resi entro 14 giorni.</p>
      </div>
    </section>
  );
}
