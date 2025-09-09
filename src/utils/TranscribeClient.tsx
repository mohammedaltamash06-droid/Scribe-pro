'use client';


'use client';

/**
 * uploadAudio(file): calls your Next.js Edge API route (/api/transcribe),
 * which forwards to the Render backend with hidden bearer token.
 */
export async function uploadAudio(file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/transcribe", {
    method: "POST",
    body: form,
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Transcribe failed: ${res.status} ${txt}`);
  }
  return res.json();
}

