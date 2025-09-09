'use client';

console.log(
  'BASE from code:',
  process.env.NEXT_PUBLIC_TRANSCRIBE_BASE_URL
);
export async function uploadAudio(file: File) {
  // ✅ Browser-safe envs
  const BASE = process.env.NEXT_PUBLIC_TRANSCRIBE_BASE_URL;
  const BEARER = process.env.NEXT_PUBLIC_TRANSCRIBE_BEARER;

  if (!BASE) throw new Error("NEXT_PUBLIC_TRANSCRIBE_BASE_URL not set");
  if (!BEARER) throw new Error("NEXT_PUBLIC_TRANSCRIBE_BEARER not set");

  const form = new FormData();
  form.append("file", file);

  // Wake backend (no-op if already warm)
  try { await fetch(`${BASE}/health`, { cache: 'no-store' }); } catch {}

  const res = await fetch(`${BASE}/transcribe`, {
    method: "POST",
    headers: { Authorization: `Bearer ${BEARER}` },
    body: form,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Transcribe failed: ${res.status} ${txt}`);
  }
  return res.json();
}
