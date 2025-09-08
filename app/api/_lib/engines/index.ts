// Utility to run the selected engine
import { openaiTranscribe } from "./openai";
import { whisperLocalTranscribe } from "./whisper-local";
import { mockTranscribe } from "./mock";

export type EngineArgs = {
  /** Either a URL to fetch the audio (recommended) or a raw buffer (fallback) */
  fileUrl?: string;
  arrayBuffer?: ArrayBuffer;

  /** Optional hints */
  language?: string;
  model?: string; // e.g. "gpt-4o-mini-transcribe" or whisper variant
};

export type EngineName = "openai" | "whisper-local" | "mock";

type EngineFn = (args: EngineArgs) => Promise<{
  /** Array of lines/segments ready for UI */
  lines: Array<{ start?: number; end?: number; text: string }>;
}>;

export const engines: Record<EngineName, EngineFn> = {
  openai: openaiTranscribe,
  "whisper-local": whisperLocalTranscribe,
  mock: mockTranscribe,
};

export function pickEngine(name?: string): EngineFn {
  const key = (name ?? process.env.TRANSCRIBE_ENGINE ?? "whisper-local") as EngineName;
  // ⛔ Disallow mock engine in production
  if (process.env.NODE_ENV === "production" && key === "mock") {
    return engines["whisper-local"];
  }
  return engines[key] ?? whisperLocalTranscribe;
}

/** One-shot helper most routes will call */
export async function runTranscribe(args: EngineArgs, name?: string) {
  const fn = pickEngine(name);
  return fn(args);
}
