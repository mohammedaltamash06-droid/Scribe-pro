"use client";
/**
 * Ping the backend's /health once to wake Render free tier.
 * Safe to call on page load.
 */
export async function wakeTranscribe() {
  const base = process.env.NEXT_PUBLIC_TRANSCRIBE_BASE_URL;
  if (!base) return;
  try {
    await fetch(`${base}/health`, { cache: 'no-store' });
  } catch {}
}
