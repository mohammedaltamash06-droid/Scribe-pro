// app/_lib/safeFetch.ts
export async function safeJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { cache: "no-store", ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("safeJson error", res.status, text.slice(0, 200));
    throw new Error("Unable to load data. Please try again.");
  }
  return res.json() as Promise<T>;
}
