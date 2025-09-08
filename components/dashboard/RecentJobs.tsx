"use client";

import React from "react";
import useSWR from "swr";
import { formatDateLocal, formatDurationShort } from "@/lib/format";

const fetcher = (u: string) => fetch(u).then(r => r.json());

function StatusBadge({ job }: { job: any }) {
  const color =
    job.state === "done" ? "bg-emerald-100 text-emerald-700" :
    job.state === "running" ? "bg-blue-100 text-blue-700" :
    "bg-rose-100 text-rose-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {job.state}
    </span>
  );
}

export default function RecentJobs() {
  const { data, error, isLoading, mutate } = useSWR("/api/jobs/recent", fetcher, { refreshInterval: 20_000 });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading recent jobs…</div>;
  if (error || !data) return <div className="text-sm text-destructive">Failed to load recent jobs.</div>;

  // support payloads: {items: Job[]} OR Job[]
  const items: any[] = Array.isArray(data) ? data : data.items || [];

  async function onRetry(id: string) {
    const res = await fetch(`/api/jobs/${id}?action=retry`, { method: "POST" });
    if (res.ok) mutate();
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this job and its files?")) return;
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (res.ok) mutate();
  }

  async function showError(id: string) {
    const res = await fetch(`/api/jobs/${id}/error`);
    const j = await res.json();
    alert(j?.data?.error_reason || "No error details");
  }

  async function downloadDocx(id: string) {
    const res = await fetch(`/api/exports/docx`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: id }),
    });
    if (!res.ok) return alert("Export failed");
    // stream download
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${id}.docx`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="text-left text-muted-foreground">
          <tr className="border-b">
            <th className="py-2 pr-4">File Name</th>
            <th className="py-2 pr-4">Doctor</th>
            <th className="py-2 pr-4">Duration</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Created</th>
            <th className="py-2 pr-4">Corrections</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.slice(0, 5).map((job) => (
            <tr key={job.id} className="border-b last:border-0">
              <td className="py-2 pr-4">{job.file_name || "-"}</td>
              <td className="py-2 pr-4">{job.doctor_name || job.doctor?.name || "-"}</td>
              <td className="py-2 pr-4">{formatDurationShort(job.duration_seconds)}</td>
              <td className="py-2 pr-4">
                <div className="flex items-center gap-2">
                  <StatusBadge job={job} />
                  {job.state === "error" ? (
                    <button
                      onClick={() => showError(job.id)}
                      className="text-xs text-rose-600 underline underline-offset-2"
                      title="Show error details"
                    >
                      details
                    </button>
                  ) : null}
                </div>
              </td>
              <td className="py-2 pr-4">{job.created_at ? formatDateLocal(job.created_at) : "-"}</td>
              <td className="py-2 pr-4">
                {/* Prefer explicit column; fallback to '-' */}
                {typeof job.corrections_count === "number" ? job.corrections_count : "-"}
              </td>
              <td className="py-2">
                <div className="flex flex-wrap gap-2">
                  <a href={`/transcribe?id=${job.id}`} className="rounded-md border px-2 py-1 hover:bg-accent">View</a>
                  <button onClick={() => downloadDocx(job.id)} className="rounded-md border px-2 py-1 hover:bg-accent">
                    Download
                  </button>
                  <button onClick={() => onRetry(job.id)} className="rounded-md border px-2 py-1 hover:bg-accent">
                    Retry
                  </button>
                  <button onClick={() => onDelete(job.id)} className="rounded-md border px-2 py-1 hover:bg-accent">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 ? (
            <tr><td colSpan={7} className="py-4 text-center text-muted-foreground">No recent jobs.</td></tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
