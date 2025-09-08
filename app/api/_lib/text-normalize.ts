type Pair = { before_text: string; after_text: string };

export function applyCorrections(text: string, pairs: Pair[]) {
  // simple, order-stable global replace; escape regex specials
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let out = text;
  for (const p of pairs) {
    const re = new RegExp(`\\b${esc(p.before_text)}\\b`, 'gi');
    out = out.replace(re, p.after_text);
  }
  return out;
}
