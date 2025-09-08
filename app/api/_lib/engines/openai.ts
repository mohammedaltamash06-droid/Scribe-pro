import { EngineArgs } from "./index";

export async function openaiTranscribe(args: EngineArgs) {
  // Minimal placeholder that keeps your current wiring.
  // Replace this block with your actual OpenAI call when you’re ready.
  // Expect either args.fileUrl or args.arrayBuffer to be set.

  // Example normalized return (UI expects { lines: [...] })
  return {
    lines: [
      { text: "OpenAI engine placeholder — replace with real call." }
    ],
  };
}
