import { NextRequest, NextResponse } from "next/server";
import { db, getAuthContext } from "@/lib/shop-api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await getAuthContext(req);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { data, error } = await db
    .from("product_variants")
    .select("*")
    .eq("product_id", id)
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await getAuthContext(req);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { data, error } = await db
    .from("product_variants")
    .insert({ ...body, product_id: id })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
