export type ShopStatus = "draft" | "active" | "archived";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: ShopStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  status: ShopStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string | null;
  collection_id: string | null;
  images: string[];
  status: ShopStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size: string | null;
  color: string | null;
  image_url: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  stock: number;
  reserved: number;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_cents: number | null;
  max_redemptions: number | null;
  times_redeemed: number;
  starts_at: string | null;
  expires_at: string | null;
  status: "active" | "disabled";
  created_at: string;
  updated_at: string;
}

export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";

export interface Order {
  id: string;
  order_number: string;
  email: string;
  status: OrderStatus;
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  total_cents: number;
  coupon_id: string | null;
  shipping_address: Record<string, unknown> | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string | null;
  product_name: string;
  variant_label: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
}

/** Prodotto completo di varianti, per la pagina di dettaglio pubblica. */
export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  images: string[];
  category: { name: string; slug: string } | null;
  collection: { name: string; slug: string } | null;
  product_variants: ProductVariant[];
}

/** Prodotto con la variante più economica in stock, per la griglia pubblica. */
export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  in_stock: boolean;
}
