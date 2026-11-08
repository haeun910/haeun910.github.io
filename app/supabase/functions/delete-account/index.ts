// Deletes the signed-in user's account. Progress, passes and profile cascade; orders keep the payment record (user_id set null)
// for the 5-year retention the e-commerce law requires.
import { admin, cors, json, userOf } from "../_shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const user = await userOf(req);
    if (!user) return json({ error: "로그인이 필요해요" }, 401);
    const sb = admin();
    await sb.from("events").insert({ user_id: null, anon_id: null, name: "account_deleted", props: { had_pass: (await sb.rpc("has_active_pass", { uid: user.id })).data === true } });
    const { error } = await sb.auth.admin.deleteUser(user.id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
