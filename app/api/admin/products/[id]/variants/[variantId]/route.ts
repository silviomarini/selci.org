import { NextRequest, NextResponse } from "next/server";
import { db, getAuthContext } from "@/lib/shop-api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const { isAdmin } = await getAuthContext(req);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, variantId } = await params;
  const body = await req.json();
  const { data, error } = await db
    .from("product_variants")
    .update(body)
    .eq("id", variantId)
    .eq("product_id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const { isAdmin } = await getAuthContext(req);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, variantId } = await params;
  const { error } = await db.from("product_variants").delete().eq("id", variantId).eq("product_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
