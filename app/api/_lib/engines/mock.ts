import { EngineArgs } from "./index";

// ⛔ If somehow imported, hard-stop in production
if (process.env.NODE_ENV === "production") {
  throw new Error("Mock engine is disabled in production.");
}

export async function mockTranscribe(_: EngineArgs = {}) {
  await new Promise(r => setTimeout(r, 300)); // tiny delay like a real call
  return {
    lines: [
      { text: "This is a  line 1." },
      { text: "This is a  line 2." },
    ],
  };
}
