import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export async function GET() {
  const supa = createAdminClient();

  const [{ count: total }, { count: done }, { count: err }] = await Promise.all([
    supa.from("jobs").select("*", { count: "exact", head: true }),
    supa.from("jobs").select("*", { count: "exact", head: true }).eq("state", "done"),
    supa.from("jobs").select("*", { count: "exact", head: true }).eq("state", "error"),
  ]);

  const { data: avgRow } = await supa
    .from("jobs")
    .select("avg:avg(duration_seconds)")
    .eq("state", "done")
    .single();

    // NEW: total audio minutes (sum of duration_seconds)
    let audio_minutes_total = 0;
    {
      const { data: sumRow, error } = await supa
        .from("jobs")
        .select("sum:sum(duration_seconds)")
        .single();
      if (!error) {
        const seconds = (sumRow as any)?.sum ?? 0;
        audio_minutes_total = Math.round((seconds / 60) * 10) / 10;
      }
    }

    // NEW: exports count (optional table)
    let exports_count = 0;
    try {
      const { count } = await supa
        .from("exports")
        .select("*", { count: "exact", head: true });
      exports_count = count ?? 0;
    } catch {
      exports_count = 0;
    }

    // NEW: avg turnaround (created_at -> processed_at) for done jobs
    let avg_turnaround_seconds = 0;
    try {
      const { data: rows } = await supa
        .from("jobs")
        .select("created_at, processed_at")
        .eq("state", "done")
        .order("created_at", { ascending: false })
        .limit(500);

      if (Array.isArray(rows) && rows.length) {
        const deltas: number[] = [];
        for (const r of rows as any[]) {
          const a = r?.created_at ? new Date(r.created_at).getTime() : undefined;
          const b = r?.processed_at ? new Date(r.processed_at).getTime() : undefined;
          if (a && b && b >= a) deltas.push((b - a) / 1000);
        }
        if (deltas.length) {
          avg_turnaround_seconds = Math.round(
            deltas.reduce((s, x) => s + x, 0) / deltas.length
          );
        }
      }
    } catch {
      // ignore if processed_at missing in schema
    }

    return NextResponse.json({
      total_jobs: total ?? 0,
      completed_jobs: done ?? 0,
      error_count: err ?? 0,
      avg_processing_seconds: (avgRow as any)?.avg ?? 0,
      audio_minutes_total,
      exports_count,
      avg_turnaround_seconds,
    });
}
