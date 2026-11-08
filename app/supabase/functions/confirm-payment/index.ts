// Called by pay.html after Toss redirects back. Verifies the amount against our order, asks Toss to confirm, then grants the pass.
import { admin, cors, json, settle, tossPost, userOf } from "../_shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const user = await userOf(req);
    if (!user) return json({ error: "로그인이 필요해요" }, 401);
    const { paymentKey, orderId, amount } = await req.json();
    if (!paymentKey || !orderId || !Number.isFinite(Number(amount))) return json({ error: "결제 정보가 올바르지 않아요" }, 400);

    const sb = admin();
    const { data: order } = await sb.from("orders").select("*").eq("order_id", orderId).maybeSingle();
    if (!order) return json({ error: "주문을 찾을 수 없어요" }, 404);
    if (order.user_id !== user.id) return json({ error: "다른 계정의 주문이에요" }, 403);
    if (order.status === "paid") { // already settled (webhook may have been first)
      const { data: pass } = await sb.from("passes").select("ends_at").eq("order_id", orderId).maybeSingle();
      return json({ ok: true, order_name: order.order_name, ends_at: pass?.ends_at });
    }
    if (Number(amount) !== order.amount) {
      await sb.from("orders").update({ status: "failed", raw: { reason: "amount mismatch", amount }, updated_at: new Date().toISOString() }).eq("order_id", orderId);
      return json({ error: "결제 금액이 주문과 달라요. 다시 시도해 주세요" }, 400);
    }

    const { ok, body } = await tossPost("/payments/confirm", { paymentKey, orderId, amount: order.amount });
    if (!ok || body.status !== "DONE") {
      await sb.from("orders").update({ status: "failed", raw: body, updated_at: new Date().toISOString() }).eq("order_id", orderId);
      return json({ error: body.message || "결제 승인에 실패했어요" }, 402);
    }
    const pass = await settle(sb, orderId, body);
    return json({ ok: true, order_name: order.order_name, ends_at: pass.ends_at });
  } catch (e) {
    return json({ error: (e as Error).message || "서버 오류" }, 500);
  }
});
