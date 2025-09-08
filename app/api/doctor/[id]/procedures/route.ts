import { NextResponse } from 'next/server';
import { listProcedures, addProceduresBulk } from '@/app/api/_lib/doctor';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { data, error } = await listProcedures(params.id);
  return NextResponse.json({ data, error }, { status: error ? 400 : 200 });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const { items = [] } = body;
  try {
    const { data, error } = await addProceduresBulk(params.id, items);
    return NextResponse.json({ data, error }, { status: error ? 400 : 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
