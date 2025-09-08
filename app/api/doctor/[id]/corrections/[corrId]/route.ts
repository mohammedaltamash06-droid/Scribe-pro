import { NextResponse } from 'next/server';
import { updateCorrection, deleteCorrections } from '@/app/api/_lib/doctor';

export async function PUT(req: Request, { params }: { params: { id: string, corrId: string } }) {
  const patch = await req.json().catch(() => ({}));
  try {
    const { data, error } = await updateCorrection(params.corrId, patch);
    return NextResponse.json({ data, error }, { status: error ? 400 : 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string, corrId: string } }) {
  const { error } = await deleteCorrections([params.corrId]);
  return NextResponse.json({ ok: !error, error }, { status: error ? 400 : 200 });
}
