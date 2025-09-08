import React, { useMemo, useCallback } from "react";

export type TranscriptPanelProps = {
  lines: any[];
  onLinesChange?: (lines: string[]) => void;
  isLoading?: boolean;
  onExport?: () => void;
};

export function TranscriptPanel({ lines, onLinesChange, isLoading }: TranscriptPanelProps) {
  const text = useMemo(
    () =>
      (lines ?? [])
        .map((l: any) => (typeof l === "string" ? l : l?.text ?? ""))
        .join("\n"),
    [lines]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const t = e.target.value.replace(/\r\n/g, "\n");
      onLinesChange?.(t.split("\n"));
    },
    [onLinesChange]
  );

  // You can keep your header/toolbar as-is, this is just the textarea panel
  return (
    <div className="px-4 py-4 flex-1">
      <textarea
        value={text}
        onChange={handleChange}
        disabled={isLoading}
        spellCheck={false}
        className="
          w-full h-full resize-none
          rounded-lg bg-slate-50 p-3
          font-mono text-[15px] md:text-base
          leading-6
          text-slate-900 antialiased
          outline-none focus:ring-2 focus:ring-slate-300
        "
      />
    </div>
  );
}
