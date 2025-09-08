// app/api/jobs/watchdog/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/api/_lib/supabase";

/**
 * Marks jobs stuck in 'running' beyond a threshold as 'error' with a reason.
 * Call manually (or via cron) e.g. /api/jobs/watchdog?minutes=30
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const minutes = parseInt(url.searchParams.get("minutes") || "30", 10);
  const thresholdMs = minutes * 60 * 1000;

  const supa = supabaseAdmin();
  const { data: running, error } = await supa
    .from("jobs")
    .select("id, created_at, state")
    .eq("state", "running");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const stale = (running || []).filter(j => {
    const t = new Date(j.created_at as any).getTime();
    return Number.isFinite(t) && (now - t) > thresholdMs;
  });

  let ok = 0, fail = 0;
  for (const j of stale) {
    // Try to store a reason if a column exists; fall back to state only.
    const { error: e1 } = await supa
      .from("jobs")
      .update({ state: "error", error_reason: `Watchdog: exceeded ${minutes}m` } as any)
      .eq("id", j.id);

    if (e1) {
      const { error: e2 } = await supa.from("jobs").update({ state: "error" }).eq("id", j.id);
      if (e2) fail++; else ok++;
    } else {
      ok++;
    }
  }

  return NextResponse.json({ checked: running?.length || 0, markedError: ok, failedUpdates: fail, thresholdMinutes: minutes });
}
