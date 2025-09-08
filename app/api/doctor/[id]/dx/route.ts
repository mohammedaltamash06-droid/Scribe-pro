


import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/* ------------------------------ Zod schemas ------------------------------ */

const dxBase = z.object({
  code: z.string().min(1, "code is required").max(64),
  text: z.string().min(1, "text is required").max(4000),
});

const createOneSchema = dxBase;
const createManySchema = z.array(dxBase).min(1);

type CreateOne = z.infer<typeof createOneSchema>;

/* ------------------------------- Utilities -------------------------------- */

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

function parseSearchParams(req: NextRequest) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") || "20", 10) || 20, 1),
    100
  );
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0);
  return { q, limit, offset };
}

/* --------------------------------- GET ----------------------------------- */
/**
 * GET /api/doctor/:id/dx?q=text&limit=20&offset=0
 * Returns { items, count, limit, offset, nextOffset }
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const { q, limit, offset } = parseSearchParams(req);

  const supabase = createAdminClient();

  // Build query
  let query = supabase
    .from("dx")
    .select("id, doctor_id, code, text", { count: "exact" })
  .eq("doctor_id", id)
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    // search code OR text – case-insensitive
    query = query.or(
      `code.ilike.%${q}%,text.ilike.%${q}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    return json({ error: error.message }, { status: 500 });
  }

  const nextOffset =
    typeof count === "number" && offset + (data?.length || 0) < count
      ? offset + (data?.length || 0)
      : null;

  return json({
    items: data ?? [],
    count: count ?? 0,
    limit,
    offset,
    nextOffset,
  });
}

/* --------------------------------- POST ---------------------------------- */
/**
 * POST /api/doctor/:id/dx
 * Body can be one object { code, text } or an array of them
 */
export async function POST(
  req: NextRequest,
  ctx: { params: { id: string } }
) {
  const { id } = ctx.params;
  const supabase = createAdminClient();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // accept single or array
  const parsedSingle = createOneSchema.safeParse(body);
  const parsedMany = createManySchema.safeParse(body);

  if (!parsedSingle.success && !parsedMany.success) {
    const issues = parsedSingle.success ? [] : parsedSingle.error.issues;
    const issues2 = parsedMany.success ? [] : parsedMany.error.issues;
    return json({ error: "Validation failed", issues: [...issues, ...issues2] }, { status: 400 });
  }

  const items: CreateOne[] = parsedSingle.success ? [parsedSingle.data] : (parsedMany.data ?? []);

  // Ensure the doctor row exists (optional but nice for FK hygiene)
  await supabase.from("doctors").upsert({ id });

  const { data, error } = await supabase
    .from("dx")
    .insert(items.map((d) => ({ ...d, doctor_id: id })))
    .select();

  if (error) return json({ error: error.message }, { status: 500 });
  return json({ items: data ?? [] }, { status: 201 });
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
    const supabase = createAdminClient();
  const body = await request.json();
  const { data, error } = await supabase
    .from("dx")
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
    .from("dx")
    .delete()
    .eq("id", body.id)
    .eq("doctor_id", id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify(data), { status: 200 });
}
