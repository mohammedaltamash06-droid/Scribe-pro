import { NextResponse } from "next/server";
import { sbAdmin } from "../../_lib/metrics";

type Params = { params: { id: string } };

// DELETE job (and best-effort remove blobs)
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const sb = sbAdmin();
    // fetch paths
    const { data: job, error: readErr } = await sb
      .from("jobs")
      .select("file_path,result_path")
      .eq("id", params.id)
      .single();
    if (readErr) throw readErr;

    // best-effort storage cleanup
    if (job?.file_path) await sb.storage.from("audio").remove([job.file_path]);
    if (job?.result_path) await sb.storage.from("results").remove([job.result_path]);

    const { error: delErr } = await sb.from("jobs").delete().eq("id", params.id);
    if (delErr) throw delErr;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

// POST /api/jobs/[id]?action=retry  -> reset and re-process
export async function POST(req: Request, { params }: Params) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action !== "retry") {
    return NextResponse.json({ ok: false, error: "unsupported_action" }, { status: 400 });
  }

  try {
    const sb = sbAdmin();

    // Reset job state
    const { error: updErr } = await sb
      .from("jobs")
      .update({ state: "uploaded", error_reason: null, result_path: null })
      .eq("id", params.id);
    if (updErr) throw updErr;

    // Chain to your existing process endpoint
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3000"}/api/jobs/${params.id}/process`, {
      method: "POST",
      cache: "no-store",
    });
    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
