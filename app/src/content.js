// Word content: loaded from the backend (free words for everyone, all words with an active pass),
// cached in the browser, and unpacked into the lookup tables the study views use.
import { CONFIG } from "./config.js";

export const WORDS = [];          // accessible word objects {id,w,pos,ko,coll,chunks,tr,q,qko,opts}
export const BY = {};             // id -> word
export const HL = {}, HLKO = {}, PARTS = {}, GLOSS = {}, QOPT = {}, TRAPS = {}, VTRAPS = {}, LEVEL = {};
export let CATALOG = [];          // every word, accessible or not: {id,w,pos,lv,tier}
export const LV_NAME = { "600": "600점", "750": "750점", "900": "900점+" };
export const LV_RANK = { "600": 0, "750": 1, "900": 2 };
export const EXPR = ["구동사", "숙어", "복합명사"];
export const isExpr = w => EXPR.includes(w.pos);
export const lvOf = id => LEVEL[id] || "600";
export const sentence = w => w.chunks.join(" ");

const CACHE_KEY = CONFIG.storageNs + "toeic-words-v" + CONFIG.contentVersion;

function reset() {
  WORDS.length = 0;
  for (const t of [BY, HL, HLKO, PARTS, GLOSS, QOPT, TRAPS, VTRAPS]) for (const k of Object.keys(t)) delete t[k];
}

function unpack(list) {
  reset();
  for (const x of list) {
    const w = { id: x.id, w: x.w, pos: x.pos, ko: x.ko, coll: x.coll, chunks: x.chunks, tr: x.tr, q: x.q, qko: x.qko, opts: x.opts };
    WORDS.push(w); BY[x.id] = w;
    if (x.hl) { HL[x.id] = x.hl; HLKO[x.id] = x.hlko || ""; }
    if (x.parts) PARTS[x.id] = x.parts;
    GLOSS[x.id] = { o: x.go || [], q: x.gq || [] };
    if (x.qm) QOPT[x.id] = x.qm;
    if (x.tg) TRAPS[x.id] = x.tg;
    if (x.tv) VTRAPS[x.id] = x.tv;
  }
}

function readCache() { try { const raw = localStorage.getItem(CACHE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
function writeCache(obj) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(obj)); } catch (e) { /* quota: keep in memory only */ } }

// Loads the catalog + accessible words. `entitled` decides whether cached pro words may be used.
export async function loadContent(backend, entitled) {
  const cached = readCache();
  if (cached && cached.catalog && cached.words) {
    CATALOG = cached.catalog;
    for (const c of CATALOG) LEVEL[c.id] = c.lv;
    unpack(cached.words.filter(w => entitled || (cached.tiers || {})[w.id] === "free"));
  }
  try {
    const [catalog, words] = await Promise.all([backend.getCatalog(), backend.getWords()]);
    if (catalog && catalog.length) {
      CATALOG = catalog;
      for (const c of CATALOG) LEVEL[c.id] = c.lv;
      const tiers = Object.fromEntries(catalog.map(c => [c.id, c.tier]));
      // keep an entitled user's full set only while entitled
      const list = words.filter(w => entitled || tiers[w.id] === "free");
      unpack(list);
      writeCache({ catalog, words: list, tiers, at: Date.now() });
    }
  } catch (e) {
    if (!WORDS.length) throw e; // nothing to show at all
    console.warn("content refresh failed, using cache", e);
  }
  return WORDS.length;
}

export const tierOf = id => (CATALOG.find(c => c.id === id) || {}).tier || "pro";
export const lockedCount = () => CATALOG.length - WORDS.length;
