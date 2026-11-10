// Builds demo/words.json (content + tier) for the browser-only builds.
// Usage: node scripts/make-demo-words.mjs [content/words.json] [--free]
//   default: every word with its tier (paid-service demo; pro words are locked in the UI only)
//   --free:  free-tier words only (public free beta; pro content never enters the bundle)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { assignTiers } from "./tiers.mjs";
const args = process.argv.slice(2);
const freeOnly = args.includes("--free");
const src = args.find(a => !a.startsWith("--")) || "content/words.json";
const words = JSON.parse(readFileSync(src, "utf8"));
const tiers = assignTiers(words);
let out = words.map(w => ({ ...w, lv: w.lv || "600", tier: tiers[w.id] }));
if (freeOnly) out = out.filter(w => w.tier === "free");
mkdirSync("demo", { recursive: true });
writeFileSync("demo/words.json", JSON.stringify(out));
const free = out.filter(w => w.tier === "free").length;
console.log(`demo/words.json: ${out.length} words, ${free} free, ${out.length - free} pro${freeOnly ? " (free beta)" : ""}`);
