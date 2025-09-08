import { NextResponse } from 'next/server';
import { updateDiagnosis, deleteDiagnoses } from '@/app/api/_lib/doctor';

export async function PUT(req: Request, { params }: { params: { id: string, dxId: string } }) {
  const patch = await req.json().catch(() => ({}));
  try {
    const { data, error } = await updateDiagnosis(params.dxId, patch);
    return NextResponse.json({ data, error }, { status: error ? 400 : 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string, dxId: string } }) {
  const { error } = await deleteDiagnoses([params.dxId]);
  return NextResponse.json({ ok: !error, error }, { status: error ? 400 : 200 });
}
