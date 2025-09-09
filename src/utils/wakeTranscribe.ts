export async function wakeTranscribe() {
  const base = process.env.NEXT_PUBLIC_TRANSCRIBE_BASE_URL!;
  try {
    await fetch(`${base}/health`, { cache: 'no-store' });
  } catch {}
}
