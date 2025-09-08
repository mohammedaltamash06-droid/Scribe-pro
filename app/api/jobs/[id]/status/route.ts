
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/api/_lib/supabase";

export const dynamic = "force-dynamic";


export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const supabase = supabaseAdmin();
  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, state, file_path, created_at")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Map server state -> numeric progress (coarse but useful)
  const steps = ["created", "uploaded", "running", "done"];
  const idx = Math.max(0, steps.indexOf(job.state));
  const progress = Math.round((idx / (steps.length - 1)) * 100);

  return NextResponse.json({
    status: job.state,   // normalized name the client already expects
    progress,            // 0..100
  });
}
