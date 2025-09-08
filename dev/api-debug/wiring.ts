import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }
  try {
    const supa = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    // Check envs
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ ok: false, error: "Missing Supabase envs" }, { status: 500 });
    }
    // Check jobs table
    const jobs = await supa.from("jobs").select("id").limit(1);
    if (jobs.error) return NextResponse.json({ ok: false, error: jobs.error.message }, { status: 500 });
    // Check transcripts table
    const transcripts = await supa.from("transcripts").select("job_id").limit(1);
    if (transcripts.error) return NextResponse.json({ ok: false, error: transcripts.error.message }, { status: 500 });
    // All good
    return NextResponse.json({ ok: true, jobs: jobs.data, transcripts: transcripts.data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
