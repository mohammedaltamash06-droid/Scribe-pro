'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Kind = 'dx' | 'rx' | 'proc';

type ApiItem = {
  id: number;
  doctor_id: string;
  code: string;
  text: string;
  created_at?: string;
};

type ApiResponse = {
  items: ApiItem[];
  count: number;
  limit: number;
  offset: number;
  nextOffset: number | null;
};

function useDebouncedValue<T>(value: T, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function CodeList({
  doctorId,
  kind,
  pageSize = 20,
  initialQuery = '',
  title,
}: {
  doctorId: string;
  kind: Kind;          // 'dx' | 'rx' | 'proc'
  pageSize?: number;
  initialQuery?: string;
  title?: string;
}) {
  const [q, setQ] = useState(initialQuery);
  const [offset, setOffset] = useState(0);
  const debouncedQ = useDebouncedValue(q, 350);

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // fetch page on offset or debounced search change
  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
    });
    if (debouncedQ.trim()) params.set('q', debouncedQ.trim());

    fetch(`/api/doctor/${doctorId}/${kind}?` + params, {
      cache: 'no-store',
      signal: ac.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.text()) || r.statusText);
        return r.json() as Promise<ApiResponse>;
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [doctorId, kind, pageSize, offset, debouncedQ]);

  // when the user types, reset to page 1
  useEffect(() => {
    setOffset(0);
  }, [debouncedQ]);

  const canPrev = useMemo(() => offset > 0, [offset]);
  const canNext = useMemo(() => data?.nextOffset != null, [data]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {title ?? kind.toUpperCase()}
          {data ? (
            <span className="ml-2 text-sm text-muted-foreground">
              ({data.count} total)
            </span>
          ) : null}
        </h2>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search code or text…"
          className="w-64 rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Text</th>
              <th className="px-3 py-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {!loading && data?.items.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                  No results
                </td>
              </tr>
            )}

            {data?.items.map((row) => (
              <tr key={`${kind}-${row.id}`} className="border-t">
                <td className="px-3 py-2 font-medium">{row.code}</td>
                <td className="px-3 py-2">{row.text}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}

            {loading && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}

            {error && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-destructive">
                  {error}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          disabled={!canPrev || loading}
          onClick={() => setOffset((o) => Math.max(0, o - pageSize))}
          className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
        >
          ◀ Prev
        </button>
        <button
          disabled={!canNext || loading}
          onClick={() => setOffset(data?.nextOffset ?? offset + pageSize)}
          className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}
