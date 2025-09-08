
import { createAdminClient } from '@/lib/supabase-server';
import { isICD10, isCPT, isRxNormCode, isPriority, nonEmpty } from './validate';

export type DoctorProfile = {
  id: string;
  name?: string | null;
  specialization?: string | null;
  preferences?: Record<string, unknown>;
};

export async function getDoctorProfile(doctorId: string) {
  const sb = createAdminClient();
  return sb.from('doctors').select('*').eq('id', doctorId).maybeSingle();
}

export async function upsertDoctorProfile(p: DoctorProfile) {
  const sb = createAdminClient();
  if (!nonEmpty(p.id)) throw new Error('Doctor ID is required');
  return sb.from('doctors').upsert({ ...p, id: p.id }).select().single();
}

/* ---------- Corrections ---------- */
export async function listCorrections(doctorId: string) {
  const sb = createAdminClient();
  return sb
    .from('doctor_corrections')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false });
}

export type NewCorrection = { before_text: string; after_text: string };
export async function addCorrectionsBulk(
  doctorId: string,
  items: NewCorrection[]
) {
  const sb = createAdminClient();
  const rows = items
    .filter(x => nonEmpty(x.before_text) && nonEmpty(x.after_text))
    .map(x => ({ doctor_id: doctorId, ...x }));
  if (!rows.length) return { data: [], error: null };
  return sb.from('doctor_corrections').insert(rows).select();
}

export async function updateCorrection(
  id: string,
  patch: Partial<NewCorrection>
) {
  const sb = createAdminClient();
  return sb.from('doctor_corrections').update(patch).eq('id', id).select().single();
}

export async function deleteCorrections(ids: string[]) {
  const sb = createAdminClient();
  if (!ids.length) return { data: null, error: null };
  return sb.from('doctor_corrections').delete().in('id', ids);
}

/* ---------- Diagnoses ---------- */
export type NewDiagnosis = {
  icd10_code: string;
  term: string;
  priority?: 'high' | 'medium' | 'low';
};
export async function listDiagnoses(doctorId: string) {
  const sb = createAdminClient();
  return sb
    .from('favorite_diagnoses')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false });
}
export async function addDiagnosesBulk(doctorId: string, items: NewDiagnosis[]) {
  const sb = createAdminClient();
  const rows = items
    .filter(x => isICD10(x.icd10_code) && nonEmpty(x.term))
    .map(x => ({
      doctor_id: doctorId,
      icd10_code: x.icd10_code.trim(),
      term: x.term.trim(),
      priority: isPriority(x.priority ?? '') ? x.priority : 'medium',
    }));
  if (!rows.length) return { data: [], error: null };
  return sb.from('favorite_diagnoses').insert(rows).select();
}
export async function updateDiagnosis(id: string, patch: Partial<NewDiagnosis>) {
  const sb = createAdminClient();
  if (patch.icd10_code && !isICD10(patch.icd10_code)) {
    throw new Error('Invalid ICD-10 code');
  }
  if (patch.priority && !isPriority(patch.priority)) {
    throw new Error('Invalid priority');
  }
  return sb.from('favorite_diagnoses').update(patch).eq('id', id).select().single();
}
export async function deleteDiagnoses(ids: string[]) {
  const sb = createAdminClient();
  if (!ids.length) return { data: null, error: null };
  return sb.from('favorite_diagnoses').delete().in('id', ids);
}

/* ---------- Medications ---------- */
export type NewMedication = {
  code_system: string;        // 'RxNorm' default
  drug_code: string;
  drug_name: string;
  strength?: string | null;
  route?: string | null;
  frequency?: string | null;
  priority?: 'high' | 'medium' | 'low';
};
export async function listMedications(doctorId: string) {
  const sb = createAdminClient();
  return sb
    .from('favorite_medications')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false });
}
export async function addMedicationsBulk(doctorId: string, items: NewMedication[]) {
  const sb = createAdminClient();
  const rows = items
    .filter(x => nonEmpty(x.drug_name) && nonEmpty(x.drug_code))
    .filter(x => x.code_system !== 'RxNorm' || isRxNormCode(x.drug_code))
    .map(x => ({
      doctor_id: doctorId,
      code_system: x.code_system || 'RxNorm',
      drug_code: x.drug_code.trim(),
      drug_name: x.drug_name.trim(),
      strength: x.strength?.trim() || null,
      route: x.route?.trim() || null,
      frequency: x.frequency?.trim() || null,
      priority: isPriority(x.priority ?? '') ? x.priority : 'medium',
    }));
  if (!rows.length) return { data: [], error: null };
  return sb.from('favorite_medications').insert(rows).select();
}
export async function updateMedication(id: string, patch: Partial<NewMedication>) {
  const sb = createAdminClient();
  if (patch.code_system === 'RxNorm' && patch.drug_code && !isRxNormCode(patch.drug_code)) {
    throw new Error('Invalid RxNorm code');
  }
  if (patch.priority && !isPriority(patch.priority)) {
    throw new Error('Invalid priority');
  }
  return sb.from('favorite_medications').update(patch).eq('id', id).select().single();
}
export async function deleteMedications(ids: string[]) {
  const sb = createAdminClient();
  if (!ids.length) return { data: null, error: null };
  return sb.from('favorite_medications').delete().in('id', ids);
}

/* ---------- Procedures ---------- */
export type NewProcedure = {
  cpt_code: string;
  description: string;
  priority?: 'high' | 'medium' | 'low';
};
export async function listProcedures(doctorId: string) {
  const sb = createAdminClient();
  return sb
    .from('favorite_procedures')
    .select('*')
    .eq('doctor_id', doctorId)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false });
}
export async function addProceduresBulk(doctorId: string, items: NewProcedure[]) {
  const sb = createAdminClient();
  const rows = items
    .filter(x => isCPT(x.cpt_code) && nonEmpty(x.description))
    .map(x => ({
      doctor_id: doctorId,
      cpt_code: x.cpt_code.trim(),
      description: x.description.trim(),
      priority: isPriority(x.priority ?? '') ? x.priority : 'medium',
    }));
  if (!rows.length) return { data: [], error: null };
  return sb.from('favorite_procedures').insert(rows).select();
}
export async function updateProcedure(id: string, patch: Partial<NewProcedure>) {
  const sb = createAdminClient();
  if (patch.cpt_code && !isCPT(patch.cpt_code)) {
    throw new Error('Invalid CPT code');
  }
  if (patch.priority && !isPriority(patch.priority)) {
    throw new Error('Invalid priority');
  }
  return sb.from('favorite_procedures').update(patch).eq('id', id).select().single();
}
export async function deleteProcedures(ids: string[]) {
  const sb = createAdminClient();
  if (!ids.length) return { data: null, error: null };
  return sb.from('favorite_procedures').delete().in('id', ids);
}
