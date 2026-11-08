// Free-tier rule, shared by the seed script and the demo build.
// Free: TOEIC-600 content only — the original 20 words, the first 180 further 600-level single words,
// and the first 10 600-level expressions of each type. Everything at 750/900 and the rest of 600 needs a pass.
export const EXPR = ["구동사", "숙어", "복합명사"];
export function assignTiers(words, { originals = 20, lv600 = 180, perExpr = 10 } = {}) {
  const tiers = {}; let n600 = 0; const ne = Object.fromEntries(EXPR.map(e => [e, 0]));
  words.forEach((w, i) => {
    const lv = w.lv || "600"; let free = false;
    if (i < originals) free = true;
    else if (lv === "600" && EXPR.includes(w.pos)) { if (ne[w.pos] < perExpr) { ne[w.pos]++; free = true; } }
    else if (lv === "600" && n600 < lv600) { n600++; free = true; }
    tiers[w.id] = free ? "free" : "pro";
  });
  return tiers;
}
