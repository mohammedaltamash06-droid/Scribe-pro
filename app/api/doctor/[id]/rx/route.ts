import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const limit = clamp(Number(url.searchParams.get("limit") || 10), 1, 100);
  const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));

  const supabase = createAdminClient();

  let query = supabase
    .from("rx")
    .select("*", { count: "exact" })
    .eq("doctor_id", id);

  if (q) {
    query = query.or(
      `code.ilike.%${q.replaceAll("%", "")}%,text.ilike.%${q.replaceAll("%", "")}%`
    );
  }

  query = query.order("created_at", { ascending: false });

  const { data, count, error } = await query.range(
    offset,
    offset + limit - 1
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const nextOffset =
    count !== null && offset + limit < count ? offset + limit : null;

  return NextResponse.json({
    items: data ?? [],
    count: count ?? 0,
    limit,
    offset,
    nextOffset,
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = createAdminClient();
  const body = await request.json();
  const { data, error } = await supabase
    .from("rx")
    .insert([{ ...body, doctor_id: id }]);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify(data), { status: 201 });
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  const supabase = createAdminClient();
  const body = await request.json();
  const { data, error } = await supabase
    .from("rx")
    .update(body)
    .eq("id", body.id)
    .eq("doctor_id", id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify(data), { status: 200 });
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  const supabase = createAdminClient();
  const body = await request.json();
  const { data, error } = await supabase
    .from("rx")
    .delete()
    .eq("id", body.id)
    .eq("doctor_id", id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify(data), { status: 200 });
}
