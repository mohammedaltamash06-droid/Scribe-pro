import { supabaseServer } from "@/app/api/_lib/supabase";

export async function GET() {
  const supabase = supabaseServer();

  // List top-level items in the "audio" bucket
  const { data, error } = await supabase
    .storage
    .from("audio")
    .list();

  return Response.json({ data, error });
}
