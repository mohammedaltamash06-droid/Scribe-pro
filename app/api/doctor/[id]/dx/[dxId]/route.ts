export async function GET(
  _req: Request,
  ctx: { params: { id: string; dxId: string } }
) {
  const { id, dxId } = ctx.params;
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("dx")
    .select("id, doctor_id, code, text")
    .eq("id", dxId)
    .eq("doctor_id", id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ item: data });
}



import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/app/api/_lib/supabase";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  code: z.string().min(1).max(64).optional(),
  text: z.string().min(1).max(4000).optional(),
}).refine((obj) => Object.keys(obj).length > 0, {
  message: "Provide at least one field to update",
});

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/* --------------------------------- PUT ----------------------------------- */
/** PUT /api/doctor/:id/dx/:dxId  Body: { code?, text? } */
export async function PUT(
  req: NextRequest,
  ctx: { params: { id: string; dxId: string } }
) {
  const { id, dxId } = ctx.params;
  const supabase = supabaseAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("dx")
    .update(parsed.data)
    .eq("doctor_id", id)
    .eq("id", dxId)
    .select()
    .single();

  if (error) return json({ error: error.message }, { status: 500 });
  return json({ item: data });
}

/** DELETE /api/doctor/:id/dx/:dxId */
export async function DELETE(
  req: NextRequest,
  ctx: { params: { id: string; dxId: string } }
) {
  const { id, dxId } = ctx.params;
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("dx")
    .delete()
    .eq("doctor_id", id)
    .eq("id", dxId);
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ ok: true });
}
