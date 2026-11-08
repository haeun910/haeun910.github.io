// Uploads the word content into Supabase. Run once after the migration, and again whenever content changes.
//   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-words.mjs content/words.json
// The service role key bypasses RLS; keep it out of .env files that get committed or shipped to the browser.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { assignTiers } from "./tiers.mjs";

const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 필요해요"); process.exit(1); }
const words = JSON.parse(readFileSync(process.argv[2] || "content/words.json", "utf8"));
const tiers = assignTiers(words);
const sb = createClient(url, key, { auth: { persistSession: false } });

const rows = words.map(w => {
  const { id, lv, ...data } = w;
  return { id, w: w.w, pos: w.pos, lv: lv || "600", tier: tiers[id], data };
});
for (let i = 0; i < rows.length; i += 200) {
  const { error } = await sb.from("words").upsert(rows.slice(i, i + 200), { onConflict: "id" });
  if (error) { console.error("upsert failed at", i, error.message); process.exit(1); }
  process.stdout.write(`\r${Math.min(i + 200, rows.length)} / ${rows.length}`);
}
// remove words that no longer exist in the content file
const ids = new Set(rows.map(r => r.id));
const { data: existing } = await sb.from("words").select("id");
const stale = (existing || []).map(r => r.id).filter(id => !ids.has(id));
if (stale.length) { const { error } = await sb.from("words").delete().in("id", stale); if (error) console.error("\ncleanup failed", error.message); else console.log(`\nremoved ${stale.length} stale words`); }
console.log(`\ndone: ${rows.length} words (${rows.filter(r => r.tier === "free").length} free)`);
