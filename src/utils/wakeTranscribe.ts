"use client";
/** Wake the Render service via server-side proxy to avoid CORS. */
export async function wakeTranscribe() {
  try {
    await fetch("/api/health", { cache: "no-store" });
  } catch {}
}
