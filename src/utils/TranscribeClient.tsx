export async function uploadAudio(file: File) {
  const BASE = process.env.NEXT_PUBLIC_TRANSCRIBE_BASE_URL!;
  const BEARER = process.env.NEXT_PUBLIC_TRANSCRIBE_BEARER!;

  if (!BASE) throw new Error("NEXT_PUBLIC_TRANSCRIBE_BASE_URL not set");
  if (!BEARER) throw new Error("NEXT_PUBLIC_TRANSCRIBE_BEARER not set");

  const form = new FormData();
  form.append("file", file);

  // Optional: wake up Render free instance
  await fetch(`${BASE}/health`).catch(() => {});

  const res = await fetch(`${BASE}/transcribe`, {
    method: "POST",
    headers: { Authorization: `Bearer ${BEARER}` },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Transcribe failed: ${res.status} → ${errText}`);
  }

  return res.json();
}
