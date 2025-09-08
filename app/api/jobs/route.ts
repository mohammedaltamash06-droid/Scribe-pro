import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/api/_lib/supabase";

export const runtime = "nodejs";
// export const dynamic = "force-dynamic"; // (removed duplicate)

export async function POST() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { detail: "Missing Supabase envs (URL or SERVICE_ROLE). Check .env.local and restart dev server." },
      { status: 500 }
    );
  }

  const supabase = supabaseAdmin();
  const jobId = (globalThis.crypto ?? require("crypto")).randomUUID();

  // Try to create the row; if schema is stricter, fall back to "id only".
  try {
    let { error } = await supabase.from("jobs").insert({ id: jobId, state: "created" as any });
    if (error) {
      // Retry with minimal insert (works if other cols are nullable/defaulted)
      const { error: err2 } = await supabase.from("jobs").insert({ id: jobId });
      if (err2) {
        // Log but DO NOT fail the request — upload route will upsert.
        console.error("[/api/jobs] insert failed:", error.message, "| retry:", err2.message);
      }
    }
  } catch (e: any) {
    console.error("[/api/jobs] throw:", e?.message ?? e);
    // Don’t block; we’ll let /upload upsert the row.
  }

  return NextResponse.json({ jobId }, { status: 200 });
}

export const dynamic = "force-dynamic";
