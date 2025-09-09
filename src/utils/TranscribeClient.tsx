'use client';

/** Calls your Next.js proxy (/api/transcribe) which forwards to Render */
export async function uploadAudio(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/transcribe", { method: "POST", body: form, cache: "no-store" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Transcribe failed: ${res.status} ${txt}`);
  }
  return res.json();
}

