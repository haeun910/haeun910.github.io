// Toss Payments return page: confirms the payment on the server, then sends the learner back to the app.
import "./styles.css";
import { BASE } from "./config.js";
import { createBackend } from "./backend/index.js";
import { esc, won } from "./ui.js";

const q = new URLSearchParams(location.search);
const el = document.getElementById("pay");
const back = (hash) => BASE + "#/" + hash;

function show(title, body, cta) { el.innerHTML = `<h2>${title}</h2><p class="muted" style="margin:0">${body}</p>${cta || ""}`; }

async function main() {
  if (q.get("code")) { // Toss failUrl
    const code = q.get("code"), msg = q.get("message") || "";
    show(code === "PAY_PROCESS_CANCELED" ? "결제를 취소했어요" : "결제가 완료되지 않았어요", esc(msg || "다시 시도해 주세요."), `<a class="btn primary" href="${back("plans")}">요금제로 돌아가기</a>`);
    return;
  }
  const paymentKey = q.get("paymentKey"), orderId = q.get("orderId"), amount = Number(q.get("amount"));
  if (!paymentKey || !orderId || !amount) { show("잘못된 접근이에요", "결제 정보가 없어요.", `<a class="btn" href="${back("home")}">앱으로</a>`); return; }
  show("결제를 확인하고 있어요", "잠시만 기다려 주세요. 이 창을 닫지 마세요.");
  try {
    const b = await createBackend();
    await b.init();
    if (!b.user) { show("로그인이 풀렸어요", "같은 브라우저에서 다시 로그인한 뒤 결제 내역을 확인해 주세요. 결제가 승인됐다면 이용권은 자동으로 열려요.", `<a class="btn primary" href="${back("login")}">로그인</a>`); return; }
    const r = await b.confirmPayment({ paymentKey, orderId, amount });
    show("이용권이 열렸어요", `${esc(r && r.order_name || "이용권")} · ${won(amount)} 결제가 완료됐어요. ${r && r.ends_at ? "이용 기간은 " + esc(new Date(r.ends_at).toLocaleDateString("ko-KR")) + "까지예요." : ""}`, `<a class="btn primary big" href="${back("home")}">학습하러 가기</a>`);
  } catch (e) {
    show("결제 확인에 실패했어요", esc(e.message || "") + " 카드가 결제됐는데 이용권이 열리지 않았다면 자동으로 다시 확인돼요. 10분 뒤에도 열리지 않으면 주문번호와 함께 문의해 주세요: " + esc(orderId), `<a class="btn" href="${back("account")}">내 정보로</a>`);
  }
}
main();
