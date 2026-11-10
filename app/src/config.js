// Build-time configuration. Values come from .env (see .env.example); nothing secret lives here.
const env = import.meta.env;

export const CONFIG = {
  demo: env.VITE_DEMO === "1",
  // Free beta build: free words only, no sign-in, no payment, no business notice. Progress stays in the browser.
  freeOnly: env.VITE_FREE === "1",
  // Prefix for every localStorage key, so builds served from the same origin (/toeic/, /toeic-next/, /toeic-free/) never share data.
  storageNs: env.VITE_STORAGE_NS || "",
  feedbackUrl: env.VITE_FEEDBACK_URL || "",
  supabaseUrl: env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY || "",
  tossClientKey: env.VITE_TOSS_CLIENT_KEY || "",
  providers: (env.VITE_AUTH_PROVIDERS || "").split(",").map(s => s.trim()).filter(Boolean), // e.g. "kakao,google"
  appName: env.VITE_APP_NAME || "토익 문장 단어장",
  supportEmail: env.VITE_SUPPORT_EMAIL || "support@example.com",
  // Legal notice (전자상거래법 표시 의무). Fill these in .env before launch.
  business: {
    name: env.VITE_BIZ_NAME || "(상호명)",
    owner: env.VITE_BIZ_OWNER || "(대표자명)",
    regNo: env.VITE_BIZ_REG_NO || "(사업자등록번호)",
    mailOrderNo: env.VITE_BIZ_MAIL_ORDER_NO || "(통신판매업 신고번호)",
    address: env.VITE_BIZ_ADDRESS || "(사업장 주소)",
    phone: env.VITE_BIZ_PHONE || "(연락처)",
  },
  // Free tier limits. Content access itself is enforced by the database (RLS), these only shape the UI.
  free: { perDayMax: 10, goals: ["all", "600"] },
  contentVersion: env.VITE_CONTENT_VERSION || "1",
};

export const BASE = import.meta.env.BASE_URL; // e.g. "/toeic/"
export const SEEN_KEY = CONFIG.storageNs + "toeic-seen";
