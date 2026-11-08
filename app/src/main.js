// Boot: local state → backend → entitlement → words → account sync → router.
import "./styles.css";
import { CONFIG, BASE, SEEN_KEY } from "./config.js";
import { createBackend } from "./backend/index.js";
import { loadLocal, attachBackend, mergeRemote, flushSave, isEmptyState, onChange } from "./state.js";
import { SESSION, go, refreshAccess, track } from "./session.js";
import * as app from "./app.js";
import * as views from "./views.js";
import { footerNotice } from "./legal.js";
import { $ } from "./ui.js";
import { CATALOG } from "./content.js";

const TABS = ["home", "book", "scores"];
let lastPath = "";

function path() {
  const h = location.hash.replace(/^#\/?/, "").split("?")[0];
  if (h) return h;
  let seen = false; try { seen = !!localStorage.getItem(SEEN_KEY); } catch (e) { }
  return (!SESSION.user && !seen && isEmptyState()) ? "welcome" : "home";
}

// Free beta has no accounts or payments: those screens send people home.
const PRODUCT_ONLY = ["plans", "account", "login", "terms", "privacy", "refund"];

function route() {
  const p = path();
  if (CONFIG.freeOnly && PRODUCT_ONLY.includes(p)) { location.replace("#/home"); return; }
  if (p !== lastPath) { app.resetRun(); window.scrollTo(0, 0); }
  lastPath = p;
  document.querySelectorAll("nav.tabs a").forEach(a => a.setAttribute("aria-current", String(a.dataset.view === p)));
  const acct = $("acct"); if (acct) { acct.classList.toggle("on", !!SESSION.user); acct.setAttribute("aria-current", String(p === "account" || p === "login")); }
  document.body.classList.toggle("landing-page", p === "welcome");
  try {
    switch (p) {
      case "book": return app.renderBook();
      case "scores": return app.renderScores();
      case "plans": return views.renderPlans();
      case "account": return views.renderAccount();
      case "login": return views.renderLogin();
      case "terms": case "privacy": case "refund": return views.renderLegal(p);
      case "welcome": return views.renderLanding();
      default: if (p !== "home") { location.replace("#/home"); return; } return app.render();
    }
  } catch (e) { console.error(e); views.renderError(e); }
}

function syncLine() {
  const el = $("sync"); if (!el) return;
  if (CONFIG.freeOnly) { el.textContent = "학습 기록은 이 기기의 브라우저에만 저장돼요. 브라우저 데이터를 지우면 사라지니, 학습 설정의 '기록 백업'으로 가끔 저장해 두세요."; return; }
  el.textContent = SESSION.user ? "학습 기록이 계정에 저장돼요. 다른 기기에서도 이어서 할 수 있어요." : "학습 기록은 이 브라우저에 저장돼요. 로그인하면 계정에 저장돼요.";
}

async function boot() {
  if (CONFIG.freeOnly) { const a = $("acct"); if (a) a.hidden = true; }
  $("foot").innerHTML = `<p class="sync" id="sync"></p>` + footerNotice();
  document.querySelectorAll("nav.tabs a").forEach(a => a.onclick = e => { e.preventDefault(); app.resetRun(); go("#/" + a.dataset.view); });
  loadLocal();
  const backend = await createBackend();
  SESSION.backend = backend; attachBackend(backend); SESSION.route = route;
  SESSION.user = await backend.init();
  await refreshAccess();
  if (SESSION.user) await mergeRemote().catch(e => console.warn("merge failed", e));
  backend.onAuth(async u => {
    SESSION.user = u;
    if (u) await mergeRemote().catch(() => { });
    await refreshAccess().catch(() => { });
    syncLine(); route();
  });
  syncLine();
  window.addEventListener("hashchange", route);
  route();
  track("app_open", { entitled: SESSION.entitled, signed_in: !!SESSION.user });
  $("wcount").textContent = CONFIG.freeOnly ? "무료 베타 · " + CATALOG.length + "개" : CONFIG.demo ? "데모" : "단어 " + CATALOG.length.toLocaleString("ko-KR") + "개";
  addEventListener("pagehide", () => { flushSave(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flushSave(); });
  if ("serviceWorker" in navigator && !import.meta.env.DEV) navigator.serviceWorker.register(BASE + "sw.js").catch(() => { });
}

window.addEventListener("error", e => { if (!$("app").children.length) views.renderError(e.error || e.message); });
boot().catch(e => { console.error(e); views.renderError(e); });
