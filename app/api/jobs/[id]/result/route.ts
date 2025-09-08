// ...existing code...
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
const RESULTS_BUCKET = "results";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

type Params = { id: string };
type MaybePromise<T> = T | Promise<T>;

export async function GET(_req: Request, ctx: { params: MaybePromise<Params> }) {
  const supa = admin();
  const { id: jobId } = await Promise.resolve(ctx.params);

  // 1) Look up the result path for this job
  const { data: job, error: jobErr } = await supa
    .from("jobs")
    .select("result_path")
    .eq("id", jobId)
    .single();

  if (jobErr || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  if (!job.result_path) {
    return NextResponse.json({ error: "Transcript not ready" }, { status: 404 });
  }

  // 2) Download the file from storage
  const { data, error: dlErr } = await supa.storage
    .from(RESULTS_BUCKET)
    .download(job.result_path);

  if (dlErr || !data) {
    return NextResponse.json({ error: "Transcript file missing" }, { status: 404 });
  }

  // 3) Best-effort export log (doesn't block download if table is absent)
  try {
    await supa.from("exports").insert({ job_id: jobId });
  } catch {
    // no-op (table optional)
  }

  // 4) Stream the file back (content type unchanged from your original)
  return new Response(data, { headers: { "content-type": "application/json" } });
}

