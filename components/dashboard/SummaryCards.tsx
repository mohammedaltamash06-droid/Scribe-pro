"use client";

import React from "react";
import useSWR from "swr";

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function SummaryCards() {
  const { data, error, isLoading } = useSWR("/api/dashboard/summary", fetcher, { refreshInterval: 30_000 });

  const card = (title: string, value: string | number, sub?: string) => (
    <div className="rounded-2xl border bg-card p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border bg-card p-4 animate-pulse h-20" />
        ))}
      </div>
    );
  }
  if (error || !data?.ok) {
    return <div className="text-destructive text-sm">Failed to load metrics.</div>;
  }

  const m = data.data as {
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    successRatePct: number;
    avgProcessingLabel: string;
    thisMonthCount: number;
  };

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
      {card("Total Jobs", m.totalJobs)}
      {card("Completed Jobs", m.completedJobs, `${m.successRatePct}% success`)}
      {card("Avg Processing Time", m.avgProcessingLabel, "time per transcription")}
      {card("Error Rate", `${m.totalJobs ? Math.round((m.failedJobs / m.totalJobs) * 100) : 0}%`)}
    </div>
  );
}
