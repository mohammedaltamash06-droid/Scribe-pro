'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

type JobState = 'created' | 'uploaded' | 'running' | 'done' | 'error' | 'failed';

type JobRow = {
  id: string;
  file_name: string | null;
  state: JobState;
  created_at: string;
  duration_seconds?: number | null;
};

const fmtDur = (s?: number | null) => {
  if (s == null) return '—';
  const d = new Date(s * 1000).toISOString();
  return s >= 3600 ? d.slice(11, 19) : d.slice(14, 19);
};

export default function RecentJobsClient() {
  const [items, setItems] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const res = await fetch('/api/jobs/recent', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        const rows: JobRow[] = Array.isArray(j?.items) ? j.items : [];
        if (ok) setItems(rows.slice(0, 5));
      } catch {
        if (ok) setItems([]);
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!items.length) return <div className="text-sm text-muted-foreground">No recent jobs.</div>;

  return (
    <div className="space-y-3">
      {items.map((j) => (
        <div key={j.id} className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm truncate">{j.file_name ?? j.id}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(j.created_at).toLocaleString()} • {fmtDur(j.duration_seconds)}
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">{j.state}</Badge>
        </div>
      ))}
    </div>
  );
}
