// app/api/_store/store.ts
export const doctors = new Map<string, {
  corrections: any[];
  dx: any[];
  rx: any[];
  proc: any[];
}>();
