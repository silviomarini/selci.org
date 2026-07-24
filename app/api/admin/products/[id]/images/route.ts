import { NextRequest, NextResponse } from "next/server";
import { db, getAuthContext } from "@/lib/shop-api";

const BUCKET = "shop-products";

// Admin-only: uploads one image to the 'shop-products' bucket (create it in
// the Supabase dashboard first, public read) and returns its public URL —
// the caller appends it to products.images itself via PATCH /api/admin/products/[id].
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { isAdmin } = await getAuthContext(req);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nessun file ricevuto" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await db.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
