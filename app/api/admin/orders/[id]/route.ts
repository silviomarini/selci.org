import { NextRequest, NextResponse } from "next/server";
import { db, getAuthContext } from "@/lib/shop-api";

const EDITABLE_STATUSES = ["fulfilled", "cancelled", "refunded"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await getAuthContext(req);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { data: order, error } = await db.from("orders").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const { data: items, error: itemsError } = await db
    .from("order_items")
    .select("*")
    .eq("order_id", id);
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

  return NextResponse.json({ ...order, items });
}

// Admin può solo cambiare lo stato dell'ordine (fulfilled/cancelled/refunded)
// dopo il pagamento — non modificare importi/articoli, che sono lo snapshot
// immutabile dell'acquisto.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await getAuthContext(req);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { status } = await req.json();
  if (!EDITABLE_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Stato non valido" }, { status: 400 });
  }

  const { data, error } = await db.from("orders").update({ status }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
