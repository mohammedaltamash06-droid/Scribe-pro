import { NextResponse } from 'next/server';
import { updateMedication, deleteMedications } from '@/app/api/_lib/doctor';

export async function PUT(req: Request, { params }: { params: { id: string, medId: string } }) {
  const patch = await req.json().catch(() => ({}));
  try {
    const { data, error } = await updateMedication(params.medId, patch);
    return NextResponse.json({ data, error }, { status: error ? 400 : 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string, medId: string } }) {
  const { error } = await deleteMedications([params.medId]);
  return NextResponse.json({ ok: !error, error }, { status: error ? 400 : 200 });
}
