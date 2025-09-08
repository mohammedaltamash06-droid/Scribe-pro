"use client";

import React from "react";
import useSWR from "swr";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function ProcessingTrends() {
  const { data, error, isLoading } = useSWR("/api/dashboard/trends", fetcher, { refreshInterval: 30_000 });

  if (isLoading) {
    return <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">Loading trends…</div>;
  }
  if (error || !data?.ok) {
    return <div className="flex h-56 items-center justify-center text-sm text-destructive">Failed to load trends.</div>;
  }

  const points = data.points as { date: string; count: number }[];
  const hasAny = points.some(p => p.count > 0);
  if (!hasAny) {
    return <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">No data in the last 30 days.</div>;
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" minTickGap={12} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
