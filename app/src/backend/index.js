import { CONFIG } from "../config.js";

// The demo backend (and its bundled word data) is only compiled into a build when VITE_DEMO=1;
// the literal comparison lets the bundler drop the branch, so a production build never ships the words.
export async function createBackend() {
  if (import.meta.env.VITE_DEMO === "1") {
    const { createLocalBackend } = await import("./local.js");
    return createLocalBackend();
  }
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseAnonKey) throw new Error("서버 설정(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)이 없어요");
  const { createSupabaseBackend } = await import("./supabase.js");
  return createSupabaseBackend();
}
