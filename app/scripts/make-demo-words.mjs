// Builds demo/words.json (content + tier) for the browser-only demo build. Usage: node scripts/make-demo-words.mjs [content/words.json]
import { readFileSync, writeFileSync } from "node:fs";
import { assignTiers } from "./tiers.mjs";
const src = process.argv[2] || "content/words.json";
const words = JSON.parse(readFileSync(src, "utf8"));
const tiers = assignTiers(words);
const out = words.map(w => ({ ...w, lv: w.lv || "600", tier: tiers[w.id] }));
writeFileSync("demo/words.json", JSON.stringify(out));
const free = out.filter(w => w.tier === "free").length;
console.log(`demo/words.json: ${out.length} words, ${free} free, ${out.length - free} pro`);
