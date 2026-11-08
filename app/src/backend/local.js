// Demo backend: runs the whole product flow (sign-in, pass, payment) inside the browser with no server.
// Used for local development and the public demo build. Nothing here is secure, by design.
const DEMO_KEY = "toeic-demo-account";

export function createLocalBackend() {
  let words = null, catalog = null, authCbs = [];
  const read = () => { try { return JSON.parse(localStorage.getItem(DEMO_KEY) || "null"); } catch (e) { return null; } };
  const write = v => { try { if (v) localStorage.setItem(DEMO_KEY, JSON.stringify(v)); else localStorage.removeItem(DEMO_KEY); } catch (e) { } };
  let acct = read();

  async function ensureWords() {
    if (words) return;
    const mod = await import("../../demo/words.json");
    const all = mod.default || mod;
    catalog = all.map(w => ({ id: w.id, w: w.w, pos: w.pos, lv: w.lv, tier: w.tier }));
    words = all;
  }

  const b = {
    mode: "local",
    user: acct ? { id: acct.id, email: acct.email } : null,
    async init() { await ensureWords(); return b.user; },
    onAuth(cb) { authCbs.push(cb); },
    _setUser(u) { b.user = u; authCbs.forEach(cb => cb(u)); },

    async sendCode(email) { acct = { id: "demo-" + btoa(unescape(encodeURIComponent(email))).replace(/[^a-z0-9]/gi, "").slice(0, 12), email, pass: null, progress: null }; return { demoCode: "123456" }; },
    async verifyCode(email, token) {
      if (token !== "123456") throw new Error("코드가 맞지 않아요 (데모 코드: 123456)");
      const prev = read(); if (prev && prev.email === email) acct = prev;
      write(acct); b._setUser({ id: acct.id, email: acct.email }); return b.user;
    },
    async signInWithProvider() { throw new Error("데모에서는 이메일 로그인만 돼요"); },
    async signOut() { acct = null; b._setUser(null); },
    async deleteAccount() { write(null); acct = null; b._setUser(null); },

    // Free beta: the bundled words are the free words only, so everything in the bundle is open.
    async getEntitlement() { if (import.meta.env.VITE_FREE === "1") return { active: true, free_beta: true }; const p = b.user && acct && acct.pass; if (p && new Date(p.ends_at) > new Date()) return { active: true, ends_at: p.ends_at, plan_id: p.plan_id }; return { active: false }; },
    async getCatalog() { await ensureWords(); return catalog; },
    async getWords() { await ensureWords(); const ent = await b.getEntitlement(); return words.filter(w => ent.active || w.tier === "free"); },

    async loadProgress() { return acct && acct.progress ? { state: acct.progress, updated_at: acct.progress.updatedAt } : null; },
    async saveProgress(state) { if (!acct) return; acct.progress = state; write(acct); },

    async getPlans() { return [{ id: "p30", name: "30일 이용권", days: 30, price_krw: 9900 }, { id: "p90", name: "90일 이용권", days: 90, price_krw: 19900 }]; },
    async createOrder(planId) { const plans = await b.getPlans(); const p = plans.find(x => x.id === planId); return { order_id: "demo_" + Date.now(), amount: p.price_krw, order_name: p.name, plan: p }; },
    // Demo "payment": grants the pass right away. The real backend only does this after Toss confirms the payment.
    async demoPay(order) {
      if (!acct || !b.user) throw new Error("로그인이 필요해요");
      const plans = await b.getPlans(); const p = plans.find(x => x.price_krw === order.amount);
      const base = acct.pass && new Date(acct.pass.ends_at) > new Date() ? new Date(acct.pass.ends_at) : new Date();
      acct.pass = { plan_id: p.id, starts_at: new Date().toISOString(), ends_at: new Date(base.getTime() + p.days * 864e5).toISOString() };
      write(acct); return acct.pass;
    },
    async confirmPayment() { throw new Error("데모에서는 실제 결제가 없어요"); },
    async listOrders() { return acct && acct.pass ? [{ order_id: "demo", order_name: "데모 이용권", amount: 0, status: "paid", created_at: acct.pass.starts_at }] : []; },
    async track(name, props) { if (import.meta.env.DEV) console.debug("[event]", name, props || {}); },
  };
  return b;
}
