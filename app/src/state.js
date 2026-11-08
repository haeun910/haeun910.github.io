// Learner state: one JSON document per person. Saved locally at once, synced to the account when signed in.
import { today, addDays } from "./ui.js";
import { CONFIG } from "./config.js";

export const KEY = CONFIG.storageNs + "toeic-state-v1";
// the prototype's key, migrated on first run. Namespaced builds (free beta) start clean instead.
export const LEGACY_KEY = CONFIG.storageNs ? "" : "toeic-proto-v1";
export const blank = () => ({ examDate: "", perDay: 20, scores: [], target: 0, learned: {}, book: {}, course: null, srs: {}, updatedAt: 0 });

export let S = blank();
let backend = null, saveTimer = null, listeners = [];

export function onChange(fn) { listeners.push(fn); }
function emit() { listeners.forEach(fn => { try { fn(S); } catch (e) { console.error(e); } }); }

function normalize(s) {
  s = Object.assign(blank(), s);
  if (!(s.perDay >= 10)) s.perDay = 20;
  s.srs = s.srs || {}; s.book = s.book || {}; s.learned = s.learned || {}; s.scores = s.scores || [];
  // every learned word has a review entry
  for (const id of Object.keys(s.learned)) if (!s.srs[id]) s.srs[id] = { box: 0, due: addDays(s.learned[id], 1), last: s.learned[id] };
  return s;
}

// Checks a pasted backup against the shape the views read, and returns a clean copy (or null).
// Today's in-progress course is dropped: it is rebuilt from the words on the next start.
export function parseBackup(text) {
  let d; try { d = JSON.parse(text); } catch (e) { return null; }
  const obj = v => v !== null && typeof v === "object" && !Array.isArray(v);
  const str = v => typeof v === "string";
  const num = v => typeof v === "number" && isFinite(v);
  const date = v => str(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);
  if (!obj(d)) return null;
  const learned = d.learned === undefined ? {} : d.learned, book = d.book === undefined ? {} : d.book;
  const srs = d.srs === undefined ? {} : d.srs, scores = d.scores === undefined ? [] : d.scores;
  if (!obj(learned) || !Object.values(learned).every(date)) return null;
  if (!obj(srs) || !Object.values(srs).every(e => obj(e) && num(e.box) && date(e.due) && (e.last === undefined || date(e.last)))) return null;
  if (!obj(book) || !Object.entries(book).every(([k, e]) => obj(e) && e.key === k && str(e.word) && num(e.count) && num(e.streak)
      && Array.isArray(e.sentences) && e.sentences.every(s => obj(s) && str(s.en)) && Array.isArray(e.confused || []))) return null;
  if (!Array.isArray(scores) || !scores.every(s => obj(s) && num(s.lc) && num(s.rc))) return null;
  if (d.examDate !== undefined && d.examDate !== "" && !date(d.examDate)) return null;
  if (d.perDay !== undefined && !num(d.perDay)) return null;
  return { ...d, learned, book, srs, scores, course: null };
}

export function replaceState(next, { touch = true } = {}) {
  S = normalize(next);
  if (touch) S.updatedAt = Date.now();
  persistLocal();
  emit();
}

function persistLocal() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked: memory only */ } }

export function loadLocal() {
  let raw = null;
  try { raw = localStorage.getItem(KEY) || (LEGACY_KEY ? localStorage.getItem(LEGACY_KEY) : null); } catch (e) { }
  if (raw) { try { S = normalize(JSON.parse(raw)); } catch (e) { S = blank(); } }
  else S = blank();
  return S;
}

export function attachBackend(b) { backend = b; }

// save(): local at once, remote after a short pause so a burst of taps becomes one write
export function save() {
  S.updatedAt = Date.now();
  persistLocal();
  if (backend && backend.user) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => backend.saveProgress(JSON.parse(JSON.stringify(S))).catch(e => console.warn("sync failed", e)), 800);
  }
}

export function flushSave() { if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; if (backend && backend.user) return backend.saveProgress(JSON.parse(JSON.stringify(S))).catch(() => { }); } return Promise.resolve(); }

// After sign-in: take whichever copy is newer; a guest's local progress moves into a fresh account.
export async function mergeRemote() {
  if (!backend || !backend.user) return;
  const remote = await backend.loadProgress();
  const hasLocal = Object.keys(S.learned).length || S.scores.length || Object.keys(S.book).length || S.examDate;
  if (remote && remote.state && (remote.state.updatedAt || 0) > (S.updatedAt || 0) && !(hasLocal && !remote.state.updatedAt)) {
    replaceState(remote.state, { touch: false });
  } else if (hasLocal || !remote) {
    await backend.saveProgress(JSON.parse(JSON.stringify(S))).catch(() => { });
  }
}

export const isEmptyState = () => !Object.keys(S.learned).length && !S.scores.length && !Object.keys(S.book).length && !S.examDate;
export { today, addDays };
