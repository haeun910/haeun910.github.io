// Runtime session: who is signed in, what they may access, and navigation helpers shared by every view.
import { loadContent } from "./content.js";

export const SESSION = {
  backend: null,
  user: null,
  ent: { active: false },   // entitlement from the backend: {active, ends_at, plan_id}
  entitled: false,
  returnTo: "",             // where to go after signing in
  route: null,              // set by main.js
};

// Change the hash, or re-render when it is already current.
export function go(hash) {
  if (location.hash === hash) { if (SESSION.route) SESSION.route(); }
  else location.hash = hash;
}

// Re-read the entitlement and reload the words it allows.
export async function refreshAccess() {
  const b = SESSION.backend;
  try { SESSION.ent = (await b.getEntitlement()) || { active: false }; } catch (e) { SESSION.ent = { active: false }; }
  SESSION.entitled = !!SESSION.ent.active;
  await loadContent(b, SESSION.entitled);
}

export function track(name, props) { try { SESSION.backend && SESSION.backend.track(name, props); } catch (e) { } }
