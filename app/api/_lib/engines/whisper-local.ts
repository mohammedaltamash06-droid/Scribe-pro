
import type { EngineArgs } from "./index";

const BASE = process.env.TRANSCRIBE_BASE_URL ?? "http://127.0.0.1:8000";

type Line = { start?: number; end?: number; text: string };

function normalize(data: any): { lines: Line[] } {
  if (Array.isArray(data?.segments)) {
    return {
      lines: data.segments.map((s: any, i: number) => ({
        start: s.start,
        end: s.end,
        text: (s.text ?? "").replace(/^\s+/, ""), // trim only the start of each line
      })),
    };
  }
  if (typeof data?.text === "string") {
    return { lines: [{ text: data.text }] };
  }
  return { lines: [] };
}

async function downloadToBlob(url: string): Promise<Blob> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`download failed: ${r.status} ${t.slice(0, 200)}`);
  }
  const ab = await r.arrayBuffer();
  const ctype = r.headers.get("content-type") || "application/octet-stream";
  return new Blob([ab], { type: ctype });
}

async function postJson(fileUrl: string, language: string) {
  const res = await fetch(`${BASE}/transcribe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: fileUrl, language }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`whisper-local failed: ${res.status} ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return normalize(data);
}

async function postMultipart(path: string, fileUrl: string, language: string) {
  const blob = await downloadToBlob(fileUrl);
  const fd = new FormData();
  fd.append("audio", blob, "audio");       // <- what your FastAPI expects
  fd.append("language", language);

  const res = await fetch(`${BASE}${path}`, { method: "POST", body: fd });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`whisper-local failed: ${res.status} ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return normalize(data);
}

async function postOctet(fileUrl: string, language: string) {
  const blob = await downloadToBlob(fileUrl);
  const res = await fetch(`${BASE}/transcribe?language=${encodeURIComponent(language)}`, {
    method: "POST",
    headers: { "content-type": "application/octet-stream" },
    body: await blob.arrayBuffer(),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`whisper-local failed: ${res.status} ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return normalize(data);
}

export async function whisperLocalTranscribe(args: EngineArgs & { audioUrl?: string }) {
  const fileUrl = (args as any).fileUrl ?? (args as any).audioUrl;
  const language = args.language ?? "en";
  if (!fileUrl && !args.arrayBuffer) {
    throw new Error("whisper-local: neither fileUrl nor arrayBuffer provided.");
  }

  // 1) Prefer JSON { url } to /transcribe
  if (fileUrl) {
    try {
      return await postJson(fileUrl, language);
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      // If server says "audio field required", fall back to multipart upload
      if (msg.includes('"audio"') && msg.includes("Field required")) {
        try {
          return await postMultipart("/transcribe", fileUrl, language);
        } catch {
          // Some setups expose multipart under /transcribe-upload
          try {
            return await postMultipart("/transcribe-upload", fileUrl, language);
          } catch {
            // Last resort: raw bytes
            return await postOctet(fileUrl, language);
          }
        }
      }
      // 404/405 (no JSON route)? try multipart directly
      if (msg.startsWith("whisper-local failed: 404") || msg.startsWith("whisper-local failed: 405")) {
        try {
          return await postMultipart("/transcribe", fileUrl, language);
        } catch {
          return await postMultipart("/transcribe-upload", fileUrl, language);
        }
      }
      // Network/other: try multipart then octet
      try {
        return await postMultipart("/transcribe", fileUrl, language);
      } catch {
        return await postOctet(fileUrl, language);
      }
    }
  }

  // 2) If you passed raw bytes, send as octet-stream
  if (args.arrayBuffer) {
    const res = await fetch(`${BASE}/transcribe?language=${encodeURIComponent(language)}`, {
      method: "POST",
      headers: { "content-type": "application/octet-stream" },
      body: args.arrayBuffer,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`whisper-local failed: ${res.status} ${t.slice(0, 200)}`);
    }
    const data = await res.json();
    return normalize(data);
  }

  // unreachable
  return { lines: [] };
}
