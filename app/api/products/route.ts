import { NextRequest, NextResponse } from "next/server";
import { listActiveProducts } from "@/lib/shop-db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));
  const limit = Math.min(24, Math.max(1, Number(searchParams.get("limit") ?? 8)));

  try {
    const { products, hasMore } = await listActiveProducts(offset, limit);
    return NextResponse.json({ products, hasMore });
  } catch (err) {
    console.error("GET /api/products error:", err);
    return NextResponse.json({ error: "Errore nel caricamento dei prodotti" }, { status: 500 });
  }
}
