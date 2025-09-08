"use client";
import * as React from "react";

type Props = {
  onFileSelected: (f: File | null) => void;
  file: File | null;
  doctorId?: string;
};

export default function StartControls({ onFileSelected, file, doctorId }: Props) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [status, setStatus] = React.useState<"idle"|"queued"|"running"|"done"|"error">("idle");
  const [jobId, setJobId] = React.useState<string | null>(null);

  const canStart = Boolean(file) && !isProcessing && (status === "idle" || status === "error");

  async function handleStart() {
    try {
      if (!file) return;
      setIsProcessing(true);
      setStatus("queued");

      // 1) create job
      const r1 = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: doctorId || "demo" }),
      });
      const j1 = await r1.json();
      if (!r1.ok || !j1?.jobId) throw new Error(j1?.error || `Create job failed (${r1.status})`);
      setJobId(j1.jobId);

      // 2) upload
      const fd = new FormData();
      fd.set("file", file);
      const r2 = await fetch(`/api/jobs/${j1.jobId}/upload`, { method: "POST", body: fd });
      const j2 = await r2.json().catch(() => ({}));
      if (!r2.ok) throw new Error(j2?.error || `Upload failed (${r2.status})`);

      // 3) process
      const r3 = await fetch(`/api/jobs/${j1.jobId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "Balanced" }),
      });
      const j3 = await r3.json().catch(() => ({}));
      if (!r3.ok) throw new Error(j3?.error || `Process failed (${r3.status})`);

      // 4) poll
      async function poll(): Promise<void> {
        const rs = await fetch(`/api/jobs/${j1.jobId}/status`);
        const js = await rs.json();
        if (js.state === "done") { setStatus("done"); return; }
        if (js.state === "error") { setStatus("error"); throw new Error(js.message || "Processing error"); }
        setStatus(js.state || "running");
        await new Promise(r => setTimeout(r, 1500));
        return poll();
      }
      await poll();

      // 5) result
      const rr = await fetch(`/api/jobs/${j1.jobId}/result`);
      const jr = await rr.json();
      console.log("[RESULT]", jr); // TODO: push lines into your TranscriptList

    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Transcription error");
      setStatus("error");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* if you want a simple input fallback in addition to your dropzone: */}
      <input
        type="file"
        accept="audio/*,video/*"
        onChange={(e) => onFileSelected(e.target.files?.[0] || null)}
      />
      <button
        type="button"               // <- important if inside any <form>
        onClick={handleStart}
        disabled={!canStart}
        className="btn btn-primary"
      >
        Start Transcription
      </button>
    </div>
  );
}
