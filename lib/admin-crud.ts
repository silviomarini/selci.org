import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { db, getAuthContext } from "@/lib/shop-api";

/**
 * Generic admin CRUD over a single Supabase table via the service-role
 * client — every handler requires isAdmin (GET included: these routes
 * bypass RLS, so an unauthenticated GET would leak draft/unpublished rows
 * that the public /api/* routes deliberately filter out).
 */
export function createAdminCollectionHandlers(table: string, orderBy: string) {
  async function GET(req: NextRequest) {
    const { isAdmin } = await getAuthContext(req);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data, error } = await db.from(table).select("*").order(orderBy);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  async function POST(req: NextRequest) {
    const { isAdmin } = await getAuthContext(req);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { data, error } = await db.from(table).insert(body).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  }

  return { GET, POST };
}

export function createAdminItemHandlers(table: string) {
  async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { isAdmin } = await getAuthContext(req);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const { data, error } = await db.from(table).select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
  }

  async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { isAdmin } = await getAuthContext(req);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { data, error } = await db.from(table).update(body).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }

  async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { isAdmin } = await getAuthContext(req);
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const { error } = await db.from(table).delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return { GET, PATCH, DELETE };
}
