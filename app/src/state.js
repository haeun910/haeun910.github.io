// Learner state: one JSON document per person. Saved locally at once, synced to the account when signed in.
import { today, addDays } from "./ui.js";

export const KEY = "toeic-state-v1";
export const LEGACY_KEY = "toeic-proto-v1"; // the prototype's key, migrated on first run
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

export function replaceState(next, { touch = true } = {}) {
  S = normalize(next);
  if (touch) S.updatedAt = Date.now();
  persistLocal();
  emit();
}

function persistLocal() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage blocked: memory only */ } }

export function loadLocal() {
  let raw = null;
  try { raw = localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY); } catch (e) { }
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
