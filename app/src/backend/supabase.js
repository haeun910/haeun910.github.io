// Production backend: Supabase Auth + Postgres (RLS) + Edge Functions. See ../../supabase for the schema.
import { createClient } from "@supabase/supabase-js";
import { CONFIG, BASE } from "../config.js";

export function createSupabaseBackend() {
  const sb = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  let authCbs = [];
  const anonId = (() => { try { let v = localStorage.getItem("toeic-anon"); if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("toeic-anon", v); } return v; } catch (e) { return "anon"; } })();

  const b = {
    mode: "supabase",
    user: null,
    client: sb,
    async init() {
      const { data: { session } } = await sb.auth.getSession();
      b.user = session ? pick(session.user) : null;
      sb.auth.onAuthStateChange((_ev, s) => { const u = s ? pick(s.user) : null; const changed = (u && u.id) !== (b.user && b.user.id); b.user = u; if (changed) authCbs.forEach(cb => cb(u)); });
      return b.user;
    },
    onAuth(cb) { authCbs.push(cb); },

    async sendCode(email) {
      const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + BASE, shouldCreateUser: true } });
      if (error) throw new Error(friendly(error));
      return {};
    },
    async verifyCode(email, token) {
      const { data, error } = await sb.auth.verifyOtp({ email, token, type: "email" });
      if (error) throw new Error(friendly(error));
      return pick(data.user);
    },
    async signInWithProvider(provider) {
      const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin + BASE } });
      if (error) throw new Error(friendly(error));
    },
    async signOut() { await sb.auth.signOut(); },
    async deleteAccount() { const { error } = await sb.functions.invoke("delete-account"); if (error) throw new Error("탈퇴 처리에 실패했어요. 잠시 후 다시 시도해 주세요"); await sb.auth.signOut(); },

    async getEntitlement() { const { data, error } = await sb.rpc("my_entitlement"); if (error) throw error; return data || { active: false }; },
    async getCatalog() { const { data, error } = await sb.from("catalog").select("id,w,pos,lv,tier"); if (error) throw error; return data; },
    async getWords() {
      // RLS returns free words for everyone and all words for an active pass
      const out = []; let from = 0; const page = 1000;
      for (; ;) { const { data, error } = await sb.from("words").select("id,lv,tier,data").range(from, from + page - 1); if (error) throw error; out.push(...data.map(r => ({ ...r.data, id: r.id, lv: r.lv, tier: r.tier }))); if (data.length < page) break; from += page; }
      return out;
    },

    async loadProgress() { if (!b.user) return null; const { data, error } = await sb.from("progress").select("state,updated_at").eq("user_id", b.user.id).maybeSingle(); if (error) throw error; return data; },
    async saveProgress(state) { if (!b.user) return; const { error } = await sb.from("progress").upsert({ user_id: b.user.id, state, updated_at: new Date().toISOString() }); if (error) throw error; },

    async getPlans() { const { data, error } = await sb.from("plans").select("id,name,days,price_krw").eq("active", true).order("sort"); if (error) throw error; return data; },
    async createOrder(planId) { const { data, error } = await sb.rpc("create_order", { p_plan: planId }); if (error) throw new Error("주문을 만들지 못했어요: " + error.message); return data; },
    async confirmPayment(payload) { const { data, error } = await sb.functions.invoke("confirm-payment", { body: payload }); if (error) { let msg = "결제 승인에 실패했어요"; try { const j = await error.context.json(); if (j && j.error) msg = j.error; } catch (e) { } throw new Error(msg); } return data; },
    async listOrders() { if (!b.user) return []; const { data } = await sb.from("orders").select("order_id,order_name,amount,status,created_at").eq("user_id", b.user.id).order("created_at", { ascending: false }).limit(20); return data || []; },

    async track(name, props) { try { await sb.from("events").insert({ user_id: b.user ? b.user.id : null, anon_id: anonId, name, props: props || {} }); } catch (e) { /* analytics never blocks the app */ } },
  };
  return b;
}

const pick = u => u ? { id: u.id, email: u.email } : null;
function friendly(error) {
  const m = (error && error.message) || "";
  if (/rate limit|too many/i.test(m)) return "요청이 너무 잦아요. 1분 뒤에 다시 시도해 주세요";
  if (/expired|invalid/i.test(m)) return "코드가 틀렸거나 만료됐어요. 다시 보내 주세요";
  return "로그인에 실패했어요: " + m;
}
