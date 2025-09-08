import { env, required } from "./env";

type Segment = { start: number; end: number; text: string };
export type EngineResponse = {
  language?: string;
  segments: Segment[];
  duration_seconds?: number;
};

export async function callWhisperWithSignedUrl(signedUrl: string): Promise<EngineResponse> {
  const base = required.transcribeBaseUrl();
  const r = await fetch(`${base}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: signedUrl, language: "en" }),
    // If your FastAPI uses CORS, ensure ALLOW_ORIGINS includes your Next origin
  });
  if (!r.ok) throw new Error(`engine ${r.status}`);
  return r.json();
}

export function normalizeSegments(segs: Segment[]): Segment[] {
  return (segs || []).map(s => ({
    start: s.start,
    end: s.end,
    text: (s.text || "").replace(/^\s+/, ""), // trim leading space per earlier fix
  }));
}
