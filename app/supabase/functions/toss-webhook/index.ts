// Toss Payments webhook (PAYMENT_STATUS_CHANGED). Backs up confirm-payment when the learner closes the browser too early,
// and records cancellations. Trusts nothing in the body: it re-fetches the payment from Toss with the secret key.
import { admin, json, settle, tossGet } from "../_shared.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  try {
    const evt = await req.json();
    const data = evt?.data || evt;
    const orderId: string | undefined = data?.orderId, paymentKey: string | undefined = data?.paymentKey;
    if (!orderId || !paymentKey) return json({ ok: true, ignored: true });

    const { ok, body: payment } = await tossGet("/payments/" + encodeURIComponent(paymentKey));
    if (!ok || payment.orderId !== orderId) return json({ error: "payment lookup failed" }, 400);

    const sb = admin();
    const { data: order } = await sb.from("orders").select("*").eq("order_id", orderId).maybeSingle();
    if (!order) return json({ ok: true, ignored: "unknown order" });

    if (payment.status === "DONE" && payment.totalAmount === order.amount) {
      if (order.status !== "paid") await settle(sb, orderId, payment);
    } else if (payment.status === "CANCELED" || payment.status === "PARTIAL_CANCELED") {
      await sb.from("orders").update({ status: "canceled", raw: payment, updated_at: new Date().toISOString() }).eq("order_id", orderId);
      if (payment.status === "CANCELED") await sb.from("passes").update({ status: "canceled" }).eq("order_id", orderId);
    } else if (["ABORTED", "EXPIRED"].includes(payment.status)) {
      await sb.from("orders").update({ status: "failed", raw: payment, updated_at: new Date().toISOString() }).eq("order_id", orderId);
    }
    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
