export function friendlyError(e: unknown): string {
  const msg = String((e as any)?.message ?? e ?? "");
  // Common engine/download cases
  if (/whisper-local/i.test(msg) || /engine/i.test(msg)) {
    if (/status=4\d\d/.test(msg)) return "The transcription engine rejected the request. Check the audio or try again.";
    if (/status=5\d\d/.test(msg)) return "The transcription engine is currently unavailable. Please try again shortly.";
    return "Couldn’t reach the transcription engine. Verify the server address and that it’s running.";
  }
  if (/download/i.test(msg) || /fetch/i.test(msg)) {
    return "We couldn’t download your audio. The signed URL may have expired—please re-upload and try again.";
  }
  return "Something went wrong. Please try again.";
}
