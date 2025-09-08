import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export const runtime = "nodejs"; // required for File/Blob + storage

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const doctorId = (form.get("doctorId") as string | null) ?? null;

  if (!file) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  const supa = createAdminClient();

  // 1) Create a job row (state defaults to 'created' in your SQL)
  const { data: jobRow, error: jobErr } = await supa
    .from("jobs")
    .insert({ doctor_id: doctorId })
    .select("id")
    .single();
  if (jobErr || !jobRow) {
    return NextResponse.json({ error: jobErr?.message || "job create failed" }, { status: 500 });
  }
  const jobId = jobRow.id as string;

  // 2) Upload to Storage
  const fileName = file.name || "audio";
  const path = `jobs/${jobId}/${fileName}`;
  const up = await supa.storage.from("audio").upload(path, file, {
    upsert: true,
    contentType: file.type || "application/octet-stream",
  });
  if (up.error) {
    return NextResponse.json({ error: up.error.message }, { status: 500 });
  }

  // 3) Update job with file metadata
  const { error: updErr } = await supa
    .from("jobs")
    .update({ file_name: fileName, file_path: path, state: "uploaded" })
    .eq("id", jobId);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, jobId, path, fileName });
}
