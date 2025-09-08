// app/api/jobs/[id]/process/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyCorrections } from '@/app/api/_lib/text-normalize';

export const runtime = "nodejs";
const AUDIO_BUCKET = "audio";
const RESULTS_BUCKET = "results";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** 1) DO NOT throw here — let caller decide and fallback to multipart on 422 */
async function callWhisperWithUrl(base: string, signedUrl: string) {
  return fetch(`${base}/transcribe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: signedUrl, language: "en" }),
  });
}

type Params = { id: string };

export async function POST(_req: Request, { params }: { params: Promise<Params> }) {
  const { id: jobId } = await params;
  const supa = admin();

  try {
    const base = process.env.TRANSCRIBE_BASE_URL!;
    if (!base) {
      return NextResponse.json({ error: "TRANSCRIBE_BASE_URL not set" }, { status: 500 });
    }

    // mark running
    await supa.from("jobs").update({ state: "running" }).eq("id", jobId);

    // load job
    const { data: job } = await supa.from("jobs").select("file_path, doctor_id").eq("id", jobId).single();
    if (!job?.file_path) {
      await supa.from("jobs").update({ state: "error" }).eq("id", jobId);
      return NextResponse.json({ error: "No file uploaded for this job." }, { status: 400 });
    }
    const fileName = job.file_path.split("/").pop() || "audio";

    // sign audio
    const signed = await supa.storage.from(AUDIO_BUCKET).createSignedUrl(job.file_path, 900);
    if (!signed.data?.signedUrl) {
      await supa.from("jobs").update({ state: "error" }).eq("id", jobId);
      return NextResponse.json({ error: "Could not sign audio" }, { status: 500 });
    }

    // 2) JSON-first call (some servers accept {url}; if 422, we'll fallback)
    let resp = await callWhisperWithUrl(base, signed.data.signedUrl);

    // 3) Fallback to multipart when missing "audio" (422) or any !ok
    if (!resp.ok) {
      // Minimal log (PHI-safe)
      console.error(`[process] whisper-local first call: status=${resp.status}`);

      const audioRes = await fetch(signed.data.signedUrl);
      const buf = await audioRes.arrayBuffer();
      const form = new FormData();
      form.append(
        "audio",
        new Blob([buf], {
          type: audioRes.headers.get("content-type") || "application/octet-stream",
        }),
        fileName
      );
      form.append("language", "en");

      resp = await fetch(`${base}/transcribe`, { method: "POST", body: form });
      if (!resp.ok) {
        console.error(`[process] whisper-local multipart: status=${resp.status}`);
        await supa.from("jobs").update({ state: "error" }).eq("id", jobId);
        return NextResponse.json({ error: "Processing failed" }, { status: 500 });
      }
    }

    let result = await resp.json();

    // --- Fetch and apply doctor corrections ---
    let corrections: { before_text: string; after_text: string }[] = [];
    if (job?.doctor_id) {
      const { data: corrData } = await supa
        .from('doctor_corrections')
        .select('before_text, after_text')
        .eq('doctor_id', job.doctor_id);
      corrections = corrData ?? [];
    }
    if (corrections.length) {
      if (typeof result.text === 'string') {
        result.text = applyCorrections(result.text, corrections);
      }
      if (Array.isArray(result.segments)) {
        result.segments = result.segments.map((seg: any) => ({
          ...seg,
          text: typeof seg.text === 'string' ? applyCorrections(seg.text, corrections) : seg.text
        }));
      }
      if (Array.isArray(result.lines)) {
        result.lines = result.lines.map((line: any) => ({
          ...line,
          text: typeof line.text === 'string' ? applyCorrections(line.text, corrections) : line.text
        }));
      }
    }

    // 4) Validate transcript JSON before saving
    const hasSegments = Array.isArray(result?.segments) || Array.isArray(result?.lines);
    const segs = result?.segments ?? result?.lines ?? [];
    const timestampsOk = hasSegments
      ? segs.every((s: any) => typeof s?.start === "number" && typeof s?.end === "number" && typeof s?.text === "string")
      : false;

    if (!hasSegments || !timestampsOk) {
      await supa.from("jobs").update({ state: "error" }).eq("id", jobId);
      return NextResponse.json({ error: "Invalid transcript JSON (segments/timestamps missing)" }, { status: 422 });
    }

    // 5) Save result JSON to results bucket (upsert)
    const resultPath = `${jobId}/${Date.now()}-result.json`;
    const payload = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const upload = await supa.storage
      .from(RESULTS_BUCKET)
      .upload(resultPath, payload, { contentType: "application/json", upsert: true });

    if (upload.error) {
      await supa.from("jobs").update({ state: "error" }).eq("id", jobId);
      return NextResponse.json({ error: "Failed to save result" }, { status: 500 });
    }

    // 6) Finish
    // primary update (with processed_at if the column exists)
    let upd = await supa
      .from("jobs")
      .update({
        state: "done",
        result_path: resultPath,
        duration_seconds: result?.duration_seconds ?? null,
        processed_at: new Date().toISOString(), // harmless if column exists
      })
      .eq("id", jobId)
      .select("result_path")
      .single();

    // fallback if 'processed_at' column doesn't exist
    if (upd.error) {
      upd = await supa
        .from("jobs")
        .update({
          state: "done",
          result_path: resultPath,
          duration_seconds: result?.duration_seconds ?? null,
        })
        .eq("id", jobId)
        .select("result_path")
        .single();
    }

    if (upd.error || !upd.data?.result_path) {
      await supa.from("jobs").update({ state: "error" }).eq("id", jobId);
      return NextResponse.json({ error: "Failed to update job.result_path" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, result_path: upd.data.result_path });
  } catch (e: any) {
    console.error("[process]", e?.message || e);
    await admin().from("jobs").update({ state: "error" }).eq("id", jobId);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

