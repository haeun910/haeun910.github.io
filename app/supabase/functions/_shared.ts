// Shared helpers for the edge functions.
import { createClient } from "npm:@supabase/supabase-js@2";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

export const admin = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

// The signed-in user behind a request (verified against Supabase Auth).
export async function userOf(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin().auth.getUser(token);
  return error ? null : data.user;
}

// Fetch a payment object from Toss with the secret key.
export async function tossGet(path: string) {
  const key = Deno.env.get("TOSS_SECRET_KEY")!;
  const r = await fetch("https://api.tosspayments.com/v1" + path, { headers: { Authorization: "Basic " + btoa(key + ":") } });
  return { ok: r.ok, body: await r.json() };
}
export async function tossPost(path: string, body: unknown) {
  const key = Deno.env.get("TOSS_SECRET_KEY")!;
  const r = await fetch("https://api.tosspayments.com/v1" + path, { method: "POST", headers: { Authorization: "Basic " + btoa(key + ":"), "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { ok: r.ok, body: await r.json() };
}

// Marks an order paid and grants the pass. Safe to call twice (idempotent on the order).
export async function settle(sb: ReturnType<typeof admin>, orderId: string, payment: Record<string, unknown>) {
  await sb.from("orders").update({ status: "paid", payment_key: payment.paymentKey, method: payment.method, approved_at: payment.approvedAt, raw: payment, updated_at: new Date().toISOString() }).eq("order_id", orderId);
  const { data, error } = await sb.rpc("grant_pass", { p_order: orderId });
  if (error) throw new Error(error.message);
  return data as { ends_at: string; plan_id: string };
}
