-- Run this in: Supabase Dashboard → SQL Editor → New query
-- Ecommerce schema for selci.org — collections, categories, products,
-- variants, coupons, orders. Separate from schema.sql (waitlist only).
--
-- Also required (run once, from the custodian package itself):
--   node_modules/@silviomarini/custodian/migrations/v0_custodian_settings.sql

-- ════════════════════════════════════════════════════════════════════════
-- COLLECTIONS (raccolta stagionale, es. "SS'26")
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS collections (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        text        UNIQUE NOT NULL,
  name        text        NOT NULL,
  description text,
  image_url   text,
  status      text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════════════
-- CATEGORIES (tipo di capo, es. "Giacche")
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS categories (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug        text        UNIQUE NOT NULL,
  name        text        NOT NULL,
  description text,
  status      text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════════════
-- PRODUCTS
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS products (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug          text        UNIQUE NOT NULL,
  name          text        NOT NULL,
  description   text,
  category_id   uuid        REFERENCES categories(id) ON DELETE SET NULL,
  collection_id uuid        REFERENCES collections(id) ON DELETE SET NULL,
  images        text[]      NOT NULL DEFAULT '{}',
  status        text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  sort_order    int         NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_status     ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection_id);

-- ════════════════════════════════════════════════════════════════════════
-- PRODUCT VARIANTS (taglia/colore — prezzo e stock per variante)
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS product_variants (
  id                     uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id             uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku                    text        UNIQUE NOT NULL,
  size                   text,
  color                  text,
  image_url              text,
  price_cents            int         NOT NULL CHECK (price_cents >= 0),
  compare_at_price_cents int         CHECK (compare_at_price_cents IS NULL OR compare_at_price_cents > price_cents),
  stock                  int         NOT NULL DEFAULT 0 CHECK (stock >= 0),
  reserved               int         NOT NULL DEFAULT 0 CHECK (reserved >= 0 AND reserved <= stock),
  status                 text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, size, color)
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

-- ════════════════════════════════════════════════════════════════════════
-- COUPONS
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS coupons (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  code            text        UNIQUE NOT NULL,
  discount_type   text        NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value  int         NOT NULL CHECK (discount_value > 0), -- % (1-100) oppure centesimi
  min_order_cents int,
  max_redemptions int,
  times_redeemed  int         NOT NULL DEFAULT 0 CHECK (times_redeemed >= 0),
  starts_at       timestamptz,
  expires_at      timestamptz,
  status          text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- ════════════════════════════════════════════════════════════════════════
-- ORDERS
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS orders (
  id                         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number               text        UNIQUE NOT NULL, -- es. SEL-2026-000123, generato in app
  email                      text        NOT NULL,
  status                     text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded')),
  subtotal_cents             int         NOT NULL,
  discount_cents             int         NOT NULL DEFAULT 0,
  shipping_cents             int         NOT NULL DEFAULT 0,
  total_cents                int         NOT NULL,
  coupon_id                  uuid        REFERENCES coupons(id) ON DELETE SET NULL,
  shipping_address           jsonb,
  stripe_checkout_session_id text        UNIQUE,
  stripe_payment_intent_id   text,
  expires_at                 timestamptz, -- limite riserva stock (safety-net cron)
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now(),
  paid_at                    timestamptz
);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session  ON orders(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status_expires  ON orders(status, expires_at);

-- ════════════════════════════════════════════════════════════════════════
-- ORDER ITEMS (snapshot immutabile a prezzo/nome d'acquisto)
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS order_items (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id         uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id       uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name     text NOT NULL,
  variant_label    text NOT NULL, -- es. "M / Verde"
  unit_price_cents int  NOT NULL,
  quantity         int  NOT NULL CHECK (quantity > 0),
  line_total_cents int  NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ════════════════════════════════════════════════════════════════════════
-- RLS — deny-by-default, stesso pattern di schema.sql (waitlist)
-- ════════════════════════════════════════════════════════════════════════
ALTER TABLE collections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items      ENABLE ROW LEVEL SECURITY;

-- Solo SELECT pubblico sul catalogo "attivo". Nessuna policy INSERT/UPDATE/DELETE
-- per anon/authenticated => negate di default da RLS; solo service_role
-- (usato dalle route API server-side) scrive.
CREATE POLICY "public_select_active_collections" ON collections
  FOR SELECT TO anon, authenticated USING (status = 'active');

CREATE POLICY "public_select_active_categories" ON categories
  FOR SELECT TO anon, authenticated USING (status = 'active');

CREATE POLICY "public_select_active_products" ON products
  FOR SELECT TO anon, authenticated USING (status = 'active');

CREATE POLICY "public_select_active_variants" ON product_variants
  FOR SELECT TO anon, authenticated
  USING (
    status = 'active'
    AND EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND p.status = 'active')
  );

-- coupons/orders/order_items: nessuna policy => RLS blocca tutto per
-- anon/authenticated; solo service_role vi accede (checkout, webhook, admin).

-- ════════════════════════════════════════════════════════════════════════
-- STOCK — reserve-then-commit (evita overselling, reversibile su timeout)
-- ════════════════════════════════════════════════════════════════════════

-- A creazione Checkout Session: riserva tutte le righe del carrello,
-- o tutte o nessuna (rollback automatico su eccezione, singola transazione RPC).
-- items: [{ "variant_id": "uuid", "quantity": 2 }, ...]
CREATE OR REPLACE FUNCTION reserve_cart_stock(items jsonb)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(items) LOOP
    UPDATE product_variants
       SET reserved = reserved + (item->>'quantity')::int
     WHERE id = (item->>'variant_id')::uuid
       AND status = 'active'
       AND (stock - reserved) >= (item->>'quantity')::int;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK:%', item->>'variant_id';
    END IF;
  END LOOP;
END;
$$;

-- Al webhook checkout.session.completed: l'ordine è pagato, la riserva
-- diventa decremento definitivo.
CREATE OR REPLACE FUNCTION commit_cart_stock(items jsonb)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(items) LOOP
    UPDATE product_variants
       SET stock    = stock - (item->>'quantity')::int,
           reserved = reserved - (item->>'quantity')::int
     WHERE id = (item->>'variant_id')::uuid;
  END LOOP;
END;
$$;

-- Al webhook checkout.session.expired/async_payment_failed, o dal cron
-- di sicurezza: libera la riserva senza toccare lo stock.
CREATE OR REPLACE FUNCTION release_cart_stock(items jsonb)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(items) LOOP
    UPDATE product_variants
       SET reserved = GREATEST(reserved - (item->>'quantity')::int, 0)
     WHERE id = (item->>'variant_id')::uuid;
  END LOOP;
END;
$$;

-- ════════════════════════════════════════════════════════════════════════
-- COUPON — redemption count atomico (stessa logica reserve/release)
-- ════════════════════════════════════════════════════════════════════════

-- A creazione Checkout Session, dopo aver validato il coupon in app:
-- incrementa times_redeemed solo se ancora valido/disponibile (guardia
-- anti-race identica a reserve_cart_stock). Ritorna true se riuscito.
CREATE OR REPLACE FUNCTION redeem_coupon(p_coupon_id uuid)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE updated_id uuid;
BEGIN
  UPDATE coupons
     SET times_redeemed = times_redeemed + 1
   WHERE id = p_coupon_id
     AND status = 'active'
     AND (starts_at IS NULL OR starts_at <= now())
     AND (expires_at IS NULL OR expires_at > now())
     AND (max_redemptions IS NULL OR times_redeemed < max_redemptions)
   RETURNING id INTO updated_id;

  RETURN updated_id IS NOT NULL;
END;
$$;

-- Simmetrico a release_cart_stock: se il checkout scade prima del pagamento.
CREATE OR REPLACE FUNCTION release_coupon(p_coupon_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE coupons
     SET times_redeemed = GREATEST(times_redeemed - 1, 0)
   WHERE id = p_coupon_id;
END;
$$;
