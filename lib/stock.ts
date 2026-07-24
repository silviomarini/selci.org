import "server-only";

import { db } from "@/lib/shop-api";

export interface CartRpcItem {
  variant_id: string;
  quantity: number;
}

export class InsufficientStockError extends Error {
  constructor(public variantId: string) {
    super(`Stock insufficiente per la variante ${variantId}`);
  }
}

/** Atomic reserve — all items or none (the RPC rolls back on its own exception). Throws InsufficientStockError. */
export async function reserveCartStock(items: CartRpcItem[]): Promise<void> {
  const { error } = await db.rpc("reserve_cart_stock", { items });
  if (error) {
    const match = /INSUFFICIENT_STOCK:(.+)/.exec(error.message);
    if (match) throw new InsufficientStockError(match[1]);
    throw new Error(error.message);
  }
}

export async function commitCartStock(items: CartRpcItem[]): Promise<void> {
  const { error } = await db.rpc("commit_cart_stock", { items });
  if (error) throw new Error(error.message);
}

export async function releaseCartStock(items: CartRpcItem[]): Promise<void> {
  const { error } = await db.rpc("release_cart_stock", { items });
  if (error) throw new Error(error.message);
}
