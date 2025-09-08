import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data, error } = await supa.from("jobs").select("id,state,file_path,result_path,created_at").eq("id", params.id).single();
  return NextResponse.json({ data, error });
}
