import { publicDb } from "@/lib/shop-public";
import type { ProductCardData, ProductDetail } from "@/lib/shop-types";

interface VariantRow {
  price_cents: number;
  compare_at_price_cents: number | null;
  stock: number;
  reserved: number;
  status: string;
}

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  images: string[];
  product_variants: VariantRow[];
}

function toCardData(row: ProductRow): ProductCardData {
  const activeVariants = row.product_variants.filter((v) => v.status === "active");
  const cheapest = activeVariants.reduce<VariantRow | null>((min, v) => {
    if (!min || v.price_cents < min.price_cents) return v;
    return min;
  }, null);
  const inStock = activeVariants.some((v) => v.stock - v.reserved > 0);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    image: row.images[0] ?? null,
    price_cents: cheapest?.price_cents ?? 0,
    compare_at_price_cents: cheapest?.compare_at_price_cents ?? null,
    in_stock: inStock,
  };
}

export async function listActiveProducts(offset: number, limit: number) {
  const { data, error, count } = await publicDb
    .from("products")
    .select("id, slug, name, images, product_variants(price_cents, compare_at_price_cents, stock, reserved, status)", {
      count: "exact",
    })
    .eq("status", "active")
    .order("sort_order")
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as ProductRow[];
  const products = rows.map(toCardData);
  const hasMore = count != null ? offset + products.length < count : products.length === limit;

  return { products, hasMore, total: count ?? products.length };
}

export async function getActiveProductBySlug(slug: string): Promise<ProductDetail | null> {
  const { data, error } = await publicDb
    .from("products")
    .select(
      "id, slug, name, description, images, category:categories(name, slug), collection:collections(name, slug), product_variants(*)"
    )
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !data) return null;
  return data as unknown as ProductDetail;
}
