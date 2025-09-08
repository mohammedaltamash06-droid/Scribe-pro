import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const doctorId = id?.trim();
  const supabase = createAdminClient();

  await supabase.from("doctors").upsert({ id: doctorId }); // ensure doctor exists
  const { data, error } = await supabase
    .from("doctor_corrections")
    .select("before_text, after_text")
    .eq("doctor_id", doctorId)
    .order("id", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: (data || []).map((r: { before_text: string; after_text: string }) => ({ before: r.before_text, after: r.after_text })) });
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const doctorId = id?.trim();
  const supa = createAdminClient();

  const body = (await req.json().catch(() => ({}))) as { before_text: string; after_text: string } | Array<{ before_text: string; after_text: string }>;
  const rows = Array.isArray(body) ? body : [body];

  const toInsert = rows.map((r) => ({
    doctor_id: doctorId,
    before_text: r.before_text ?? null,
    after_text: r.after_text ?? null,
  }));

  const { error } = await supa.from("doctor_corrections").insert(toInsert);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
