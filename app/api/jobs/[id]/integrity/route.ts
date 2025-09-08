// app/api/jobs/[id]/integrity/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/api/_lib/supabase";

const AUDIO_BUCKET = "audio";
const RESULTS_BUCKET = "results";

async function exists(supa: ReturnType<typeof supabaseAdmin>, bucket: string, fullPath: string) {
  const parts = fullPath.split("/");
  const file = parts.pop()!;
  const prefix = parts.join("/");
  const { data, error } = await supa.storage.from(bucket).list(prefix || "", { limit: 100 });
  if (error) return { ok: false, error: error.message };
  const found = (data || []).some((o: any) => o.name === file);
  return { ok: found };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }>}) {
  const { id } = await params;
  const supa = supabaseAdmin();

  const { data: job, error } = await supa
    .from("jobs")
    .select("id, file_path, result_path, state")
    .eq("id", id)
    .single();

  if (error || !job) {
    return NextResponse.json({ ok: false, error: "Job not found" }, { status: 404 });
  }

  const audio = job.file_path
    ? await exists(supa, AUDIO_BUCKET, job.file_path)
    : { ok: false, error: "No file_path" };

  const result = job.result_path
    ? await exists(supa, RESULTS_BUCKET, job.result_path)
    : { ok: false, error: "No result_path" };

  return NextResponse.json({
    ok: true,
    job: { id: job.id, state: job.state },
    audio,
    result
  });
}
