import { NextResponse } from 'next/server';
import { getDoctorProfile, upsertDoctorProfile } from '@/app/api/_lib/doctor';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { data, error } = await getDoctorProfile(params.id);
  return NextResponse.json({ data, error }, { status: error ? 400 : 200 });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  try {
    const { data, error } = await upsertDoctorProfile({ id: params.id, ...body });
    return NextResponse.json({ data, error }, { status: error ? 400 : 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
