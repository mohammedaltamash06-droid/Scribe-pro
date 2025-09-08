import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  const supa = createAdminClient();
  const { data, error } = await supa
    .from("jobs")
    .select("state, duration_seconds")
    .eq("id", jobId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ state: data?.state ?? "unknown", duration_seconds: data?.duration_seconds ?? 0 });
}
