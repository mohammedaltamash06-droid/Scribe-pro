"use client";

import { useMemo, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Mic } from "lucide-react";

type Line = string | { text?: string };
type Props = {
  lines?: Line[];
  isLoading?: boolean;
  onLinesChange?: (next: string[]) => void; // keep your existing state shape
};

export default function TranscriptPanel({
  lines = [],
  isLoading = false,
  onLinesChange,
}: Props) {
  // ---- ALWAYS call hooks in the same order (top-level)
  const { toast } = useToast();
    // Export handler with toast
    async function handleExport(jobId: string) {
      const res = await fetch(`/api/jobs/${jobId}/result`, { method: "GET" });
      if (!res.ok) {
        toast({
          title: "Export failed",
          description: "Could not fetch the transcript file. Please try again.",
          variant: "destructive",
        });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      toast({
        title: "Export ready",
        description: (
          <a
            href={url}
            download={`transcript-${jobId}.json`}
            className="underline"
            onClick={() => setTimeout(() => URL.revokeObjectURL(url), 2000)}
          >
            Click to download
          </a>
        ),
      });
      // Optional: auto-download
      // const a = document.createElement("a");
      // a.href = url;
      // a.download = `transcript-${jobId}.json`;
      // a.click();
      // URL.revokeObjectURL(url);
    }
    const normalized = useMemo(
      () => (lines ?? []).map((l) => (typeof l === "string" ? l : l?.text ?? "")),
      [lines]
    );
    const lineCount = normalized.length;
    const joined = useMemo(() => normalized.join("\n"), [normalized]);

    const editorRef = useRef<HTMLDivElement>(null);

    const handleInput = useCallback(
      (e: React.FormEvent<HTMLDivElement>) => {
        const t = (e.currentTarget.textContent || "").replace(/\r\n/g, "\n");
        onLinesChange?.(t.split("\n"));
      },
      [onLinesChange]
    );

    // Keep editor in sync if parent updates text externally
    useEffect(() => {
      const el = editorRef.current;
      if (!el) return;
      if (el.textContent !== joined) {
        el.textContent = joined;
      }
    }, [joined]);

    return (
  <section className="rounded-xl border border-slate-200 bg-white shadow-sm h-full min-h-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="font-medium text-slate-800">Medical Transcript</div>
          <span className="text-xs text-slate-500">{lineCount} lines</span>
        </div>

        {/* Body */}
        <div className="px-4 py-4 flex-1 min-h-0">
          <div className="relative h-[calc(100%-8px)] overflow-hidden flex flex-col min-h-0">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                Transcribing…
              </div>
            ) : lineCount === 0 ? (
              // Empty state (unchanged)
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Mic className="h-8 w-8 text-slate-300 mb-3" />
                <div className="text-sm font-medium text-slate-600">No transcript available</div>
                <div className="text-xs text-slate-400">
                  Upload an audio file and start transcription to see results
                </div>
              </div>
            ) : (
              // EDITABLE, justified, hyphenated, ~19px
              <div className="flex-1 min-h-0">
                <textarea
                  value={joined}
                  onChange={e => onLinesChange?.(e.target.value.split("\n"))}
                  className="w-full h-full whitespace-pre-wrap outline-none resize-none overflow-auto rounded-md border border-slate-200 bg-white px-3 py-3 shadow-inner font-sans text-slate-900 antialiased focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                  style={{
                    minHeight: 0,
                    maxHeight: '100%',
                    overflow: 'auto',
                    fontSize: "19px",
                    lineHeight: 1.6,
                    textAlign: "justify",
                    textJustify: "inter-word",
                    hyphens: "auto",
                    WebkitHyphens: "auto",
                    msHyphens: "auto",
                  }}
                />
                {/* Example export button for demonstration; wire up as needed */}
                {/* <button onClick={() => handleExport('jobId')}>Export</button> */}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }
