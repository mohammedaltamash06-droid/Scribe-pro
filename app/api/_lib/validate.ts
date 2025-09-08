export type Priority = 'high' | 'medium' | 'low';

export const isICD10 = (s: string) =>
  /^[A-TV-Z][0-9]{2}(\.[A-Z0-9]{1,3})?$/.test(s.trim());

export const isCPT = (s: string) =>
  /^[0-9]{5}$/.test(s.trim());

export const isRxNormCode = (s: string) =>
  /^[0-9]+$/.test(s.trim());

export const isPriority = (p: string): p is Priority =>
  p === 'high' || p === 'medium' || p === 'low';

export const nonEmpty = (s?: string | null) => !!s && s.trim().length > 0;
