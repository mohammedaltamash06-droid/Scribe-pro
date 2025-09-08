import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * SERVER-ONLY supabase admin client
 */
export const sbAdmin = () =>
  createClient(url, serviceKey, { auth: { persistSession: false } });

export type SummaryMetrics = {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  successRatePct: number; // 0..100
  avgProcessingSec: number; // seconds
  avgProcessingLabel: string; // "2.5 min" etc
  thisMonthCount: number;
};

export type TrendPoint = { date: string; count: number };

export async function getSummaryMetrics(): Promise<SummaryMetrics> {
  const sb = sbAdmin();

  // counts (head+count avoids fetching rows)
  const [{ count: totalJobs }, { count: completedJobs }, { count: failedJobs }] =
    await Promise.all([
      sb.from("jobs").select("id", { count: "exact", head: true }),
      sb.from("jobs").select("id", { count: "exact", head: true }).eq("state", "done"),
      sb.from("jobs").select("id", { count: "exact", head: true }).eq("state", "error"),
    ]);

  const successRatePct =
    totalJobs && totalJobs > 0
      ? Math.round(((completedJobs || 0) / totalJobs) * 1000) / 10
      : 0;

  // Average processing time:
  // Prefer duration_seconds on 'done' rows; if many are null,
  // fall back to (updated_at - created_at) in JS.
  const { data: doneRows, error } = await sb
    .from("jobs")
    .select("created_at, updated_at, duration_seconds")
    .eq("state", "done")
    .limit(2000); // safety cap

  if (error) throw error;

  let durations: number[] = [];
  for (const r of doneRows || []) {
    if (typeof r.duration_seconds === "number") {
      durations.push(r.duration_seconds);
    } else if (r.updated_at && r.created_at) {
      const ms =
        new Date(r.updated_at as string).getTime() -
        new Date(r.created_at as string).getTime();
      if (ms > 0) durations.push(ms / 1000);
    }
  }

  const avgProcessingSec =
    durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

  // This month total (UTC month)
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { count: thisMonthCount } = await sb
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfMonth.toISOString());

  return {
    totalJobs: totalJobs || 0,
    completedJobs: completedJobs || 0,
    failedJobs: failedJobs || 0,
    successRatePct,
    avgProcessingSec,
    avgProcessingLabel: humanizeSeconds(avgProcessingSec),
    thisMonthCount: thisMonthCount || 0,
  };
}

export async function getTrendsLast30Days(): Promise<TrendPoint[]> {
  const sb = sbAdmin();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  since.setUTCHours(0, 0, 0, 0);

  // fetch only required columns; group in-memory
  const { data, error } = await sb
    .from("jobs")
    .select("created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true })
    .limit(5000);

  if (error) throw error;

  // group by YYYY-MM-DD (UTC)
  const bucket = new Map<string, number>();
  for (const r of data || []) {
    const d = new Date(r.created_at as string);
    const key = d.toISOString().slice(0, 10);
    bucket.set(key, (bucket.get(key) || 0) + 1);
  }

  // fill missing days with 0 for a smooth chart
  const points: TrendPoint[] = [];
  const cursor = new Date(since);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    points.push({ date: key, count: bucket.get(key) || 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return points;
}

function humanizeSeconds(sec: number): string {
  if (!sec || sec <= 0) return "0 min";
  if (sec < 60) return `${Math.round(sec)} sec`;
  const mins = sec / 60;
  // show 1 decimal under 10 min; whole minutes otherwise
  return mins < 10 ? `${Math.round(mins * 10) / 10} min` : `${Math.round(mins)} min`;
}
