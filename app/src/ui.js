// Small shared helpers: escaping, shuffling, dates, toasts, speech.
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
export function addDays(d, n) { const t = new Date(d + "T00:00"); t.setDate(t.getDate() + n); return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"); }
export const fmtDate = iso => { if (!iso) return ""; const d = new Date(iso); return d.getFullYear() + "년 " + (d.getMonth() + 1) + "월 " + d.getDate() + "일"; };
export const won = n => Number(n).toLocaleString("ko-KR") + "원";

let toastTimer = null;
export function toast(msg, ms = 1800) {
  const t = document.getElementById("toast"); if (!t) return;
  t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), ms);
}

export function speak(text) {
  try { const u = new SpeechSynthesisUtterance(text); u.lang = "en-US"; u.rate = 0.95; speechSynthesis.cancel(); speechSynthesis.speak(u); }
  catch (e) { toast("이 브라우저에서는 발음 듣기가 안 돼요"); }
}

export const $ = id => document.getElementById(id);
export const on = (id, ev, fn) => { const el = $(id); if (el) el[ev] = fn; return el; };
