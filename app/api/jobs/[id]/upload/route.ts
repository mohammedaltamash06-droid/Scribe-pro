import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/api/_lib/supabase";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const supabase = supabaseAdmin();
  const key = `jobs/${id}/${file.name || `${id}.mp3`}`;
  const arrayBuf = await file.arrayBuffer();
  const { error: upErr } = await supabase.storage
    .from("audio")
    .upload(key, arrayBuf, { upsert: true, contentType: file.type || "audio/mpeg" });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // Save file_path on the job row so /process can find it
  const { error: dbErr } = await supabase
    .from("jobs")
    .update({ file_path: key, state: "uploaded" })
    .eq("id", id);
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({ key });
}
