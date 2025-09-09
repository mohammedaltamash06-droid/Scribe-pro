import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side proxy to Render backend (hides bearer token).
 * Client usage:
 *   const form = new FormData();
 *   form.append('file', file);
 *   const res = await fetch('/api/transcribe', { method: 'POST', body: form });
 */
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const BASE = process.env.TRANSCRIBE_BASE_URL;
  const BEARER = process.env.TRANSCRIBE_BEARER;

  if (!BASE || !BEARER) {
    return NextResponse.json(
      { error: "Server misconfigured: set TRANSCRIBE_BASE_URL and TRANSCRIBE_BEARER" },
      { status: 500 }
    );
  }

  try {
    const form = await req.formData();
    const upstream = await fetch(`${BASE}/transcribe`, {
      method: "POST",
      headers: { Authorization: `Bearer ${BEARER}` },
      body: form,
      cache: "no-store",
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 502 });
  }
}
