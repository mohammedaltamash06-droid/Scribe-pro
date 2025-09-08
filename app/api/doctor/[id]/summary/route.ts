import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Params = { id: string };
type MaybePromise<T> = T | Promise<T>;

export async function GET(
  _req: Request,
  context: { params: MaybePromise<Params> }
) {
  const supa = createAdminClient();
  const { id: doctorId } = await Promise.resolve(context.params);

  const [doc, corrections, dx, rx, proc] = await Promise.all([
    supa.from("doctors").select("*").eq("id", doctorId).maybeSingle(),
    supa.from("doctor_corrections").select("*").eq("doctor_id", doctorId).order("created_at", { ascending: false }),
    supa.from("dx").select("*").eq("doctor_id", doctorId).order("created_at", { ascending: false }),
    supa.from("rx").select("*").eq("doctor_id", doctorId).order("created_at", { ascending: false }),
    supa.from("proc").select("*").eq("doctor_id", doctorId).order("created_at", { ascending: false })
  ]);

  if (doc.error) return NextResponse.json({ error: doc.error.message }, { status: 500 });

  return NextResponse.json({
    doctor: doc.data ?? null,
    corrections: corrections.data ?? [],
    dx: dx.data ?? [],
    rx: rx.data ?? [],
    proc: proc.data ?? [],
  });
}

