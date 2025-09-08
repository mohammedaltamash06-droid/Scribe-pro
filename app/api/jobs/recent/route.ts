

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supa = createAdminClient();

    const { data, error } = await supa
      .from("jobs")
      .select("id, state, doctor_id, file_name, file_path, duration_seconds, created_at")
      .eq("state", "done")                               // only completed jobs
      .order("created_at", { ascending: false })         // newest first
      .limit(5);                                         // last 5

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, items: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
