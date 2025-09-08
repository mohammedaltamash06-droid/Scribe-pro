import { NextResponse } from "next/server";
import { sbAdmin } from "../../../_lib/metrics";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const sb = sbAdmin();
    const { data, error } = await sb
      .from("jobs")
      .select("id,state,error_reason")
      .eq("id", params.id)
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "error_lookup_failed" },
      { status: 500 }
    );
  }
}
