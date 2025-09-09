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

  // wake Render free tier (optional)
  await fetch(`${BASE}/health`).catch(() => {});

  const res = await fetch(`${BASE}/transcribe`, {
    method: "POST",
    headers: { Authorization: `Bearer ${BEARER}` },
    body: form,
  });

  if (!res.ok) throw new Error(`Transcribe failed: ${res.status}`);
  return res.json();
}
