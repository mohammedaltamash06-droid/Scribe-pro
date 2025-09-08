import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Change this to your actual engine call if different
async function callEngine(signedUrl: string) {
  const base = process.env.TRANSCRIBE_BASE_URL || "http://127.0.0.1:8000";
  const r = await fetch(`${base}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: signedUrl, language: "en" }),
  });
  if (!r.ok) throw new Error(`engine ${r.status}`);
  return r.json() as Promise<{ language?: string; segments: { start:number; end:number; text:string }[]; duration_seconds?: number }>;
}

export async function POST(req: Request) {
  const supa = admin();
  const { jobId } = await req.json().catch(() => ({}));
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  // 1) Move job to running
  await supa.from("jobs").update({ state: "running" }).eq("id", jobId);

  // 2) Load file_path
  const { data: job, error: jErr } = await supa
    .from("jobs")
    .select("id, file_path")
    .eq("id", jobId)
    .single();

  if (jErr || !job?.file_path) {
    await supa.from("jobs").update({ state: "error" }).eq("id", jobId);
    return NextResponse.json({ error: jErr?.message || "job/file missing" }, { status: 400 });
  }

  // 3) Signed URL to feed engine
  const signed = await supa.storage.from("audio").createSignedUrl(job.file_path, 60 * 60);
  if (signed.error || !signed.data?.signedUrl) {
    await supa.from("jobs").update({ state: "error" }).eq("id", jobId);
    return NextResponse.json({ error: signed.error?.message || "signed url" }, { status: 500 });
  }

  try {
    // 4) Run engine
    const engine = await callEngine(signed.data.signedUrl);
    const segments = (engine.segments || []).map(s => ({ ...s, text: (s.text || "").replace(/^\s+/, "") }));
    const language = engine.language || "en";
    const duration = engine.duration_seconds ?? Math.ceil(segments.at(-1)?.end ?? 0);

    // 5) Persist results: Storage JSON + transcripts row
    const resultPath = `jobs/${jobId}/transcript.json`;
    const jsonBlob = new Blob([JSON.stringify({ language, segments }, null, 2)], { type: "application/json" });

    const upload = await supa.storage.from("results").upload(resultPath, jsonBlob, {
      upsert: true,
      contentType: "application/json",
    });
    if (upload.error) throw new Error(upload.error.message);

    const text = segments.map(s => s.text).join("\n");

    const { error: tErr } = await supa.from("transcripts").insert({
      job_id: jobId,
      language,
      text,
      segments, // jsonb
    });
    if (tErr) throw new Error(tErr.message);

    // 6) Only now: mark done + set result_path + duration
    const { error: uErr } = await supa
      .from("jobs")
      .update({ state: "done", result_path: resultPath, duration_seconds: duration })
      .eq("id", jobId);

    if (uErr) throw new Error(uErr.message);

    return NextResponse.json({ ok: true, jobId, language, duration, result_path: resultPath });
  } catch (e: any) {
    console.error("start route error:", e);
    await supa.from("jobs").update({ state: "error" }).eq("id", jobId);
    return NextResponse.json({ error: e?.message || "engine/storage error" }, { status: 500 });
  }
}
