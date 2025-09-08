import { NextResponse } from "next/server";
import { getTrendsLast30Days } from "../../_lib/metrics";

export async function GET() {
  try {
    const points = await getTrendsLast30Days();
    return NextResponse.json({ ok: true, points });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "trends_failed" },
      { status: 500 }
    );
  }
}
