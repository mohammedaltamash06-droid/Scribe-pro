import { NextRequest, NextResponse } from "next/server";
export const runtime = 'edge';

export async function GET(_req: NextRequest) {
  const BASE = process.env.TRANSCRIBE_BASE_URL;
  if (!BASE) {
    return NextResponse.json({ error: "TRANSCRIBE_BASE_URL not set" }, { status: 500 });
  }
  try {
    const r = await fetch(`${BASE}/health`, { cache: 'no-store' });
    const text = await r.text();
    return new NextResponse(text, {
      status: r.status,
      headers: { "Content-Type": r.headers.get("Content-Type") || "application/json" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 502 });
  }
}
