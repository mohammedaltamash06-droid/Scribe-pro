import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET() {
  const supa = createAdminClient();
  const { data, error } = await supa
    .from("jobs")
    .select("id, doctor_id, file_name, duration_seconds, created_at, transcripts:transcripts!inner(language)")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}
