// Product views around the study app: landing, sign-in, plans & payment, account, legal pages, error screen.
import { CONFIG, BASE, SEEN_KEY } from "./config.js";
import { CATALOG, WORDS, lockedCount } from "./content.js";
import { S, replaceState, blank, flushSave } from "./state.js";
import { esc, toast, fmtDate, won, $ } from "./ui.js";
import { SESSION, go, refreshAccess, track } from "./session.js";
import { termsHtml, privacyHtml, refundHtml } from "./legal.js";

const $app = () => $("app");
const total = () => (CATALOG.length || 1569).toLocaleString("ko-KR");

// ---------- Landing ----------
export function renderLanding() {
  track("landing_view");
  $app().innerHTML = `
  <section class="sheet landing">
    <span class="eyebrow">TOEIC 단어 · 문장으로 외우기</span>
    <h1 class="display">단어가 아니라<br>문장이 외워져요</h1>
    <p class="lead">토익 빈출 단어${CONFIG.freeOnly ? "" : " " + total() + "개"}를 실제 시험에 나오는 문장 속에서 배워요. 문장 배열, 빈칸 퀴즈, 해석 퀴즈로 바로 써 보고, 틀린 단어는 다음 날 자동으로 다시 나와요.</p>
    ${CONFIG.freeOnly
      ? `<div class="row"><a class="btn primary big" href="#/home" id="start">바로 시작하기</a></div>
    <p class="muted" style="margin:0">지금은 무료 베타예요. 가입 없이 600점 필수 단어·표현 ${WORDS.length}개를 배울 수 있어요. 학습 기록은 이 기기의 브라우저에만 저장돼요.</p>`
      : `<div class="row"><a class="btn primary big" href="#/home" id="start">무료로 시작하기</a><a class="btn big" href="#/login">로그인</a></div>
    <p class="muted" style="margin:0">가입 없이 무료 단어 ${WORDS.length || 230}개를 바로 배울 수 있어요. 로그인하면 기록이 계정에 저장돼요.</p>`}
  </section>
  <section class="sheet">
    <h2>이렇게 배워요</h2>
    <div class="feat"><b>1. 암기카드</b><span>단어와 뜻, 자주 쓰는 짝(collocation)을 먼저 봐요.</span></div>
    <div class="feat"><b>2. 문장 배열</b><span>흩어진 블록을 순서대로 놓아 문장을 완성해요. 어려움 모드에서는 파트5 함정 단어가 섞여요.</span></div>
    <div class="feat"><b>3. 빈칸·해석 퀴즈</b><span>파트5 형식의 4지선다로 확인해요. 틀리면 헷갈린 단어와 함께 단어장에 담겨요.</span></div>
    <div class="feat"><b>4. 간격 복습</b><span>맞힌 단어는 1·3·7·14·30·60일 뒤에, 틀린 단어는 다음 날 다시 나와요.</span></div>
  </section>
  ${CONFIG.freeOnly ? "" : `<section class="sheet">
    <h2>무료와 이용권</h2>
    <table class="cmp"><tr><th></th><th>무료</th><th>이용권</th></tr>
      <tr><td>단어·표현</td><td>${WORDS.length || 230}개</td><td>${total()}개 전부</td></tr>
      <tr><td>하루 새 단어</td><td>10개</td><td>최대 50개</td></tr>
      <tr><td>목표 레벨</td><td>600점</td><td>600 · 750 · 900+</td></tr>
      <tr><td>단어장·기록장·간격 복습</td><td>O</td><td>O</td></tr>
      <tr><td>기기 간 동기화</td><td>로그인 시</td><td>로그인 시</td></tr></table>
    <a class="btn" href="#/plans">이용권 가격 보기</a>
  </section>`}`;
  $("start").onclick = () => { try { localStorage.setItem(SEEN_KEY, "1"); } catch (e) { } };
}

// ---------- Sign in ----------
const auth = { stage: "email", email: "", demoCode: "", busy: false };
export function renderLogin() {
  const b = SESSION.backend;
  if (SESSION.user) { go("#/account"); return; }
  const providers = CONFIG.providers.length ? `<div class="or"><span>또는</span></div><div class="row">${CONFIG.providers.map(p => `<button class="btn prov" data-p="${esc(p)}">${{ kakao: "카카오로 계속하기", google: "Google로 계속하기", apple: "Apple로 계속하기" }[p] || p + "로 계속하기"}</button>`).join("")}</div>` : "";
  $app().innerHTML = `<section class="sheet auth">
    <h2>로그인</h2>
    <p class="muted" style="margin:0">이메일로 받은 6자리 코드를 넣으면 돼요. 비밀번호는 없어요. 처음이면 자동으로 가입돼요.</p>
    ${auth.stage === "email" ? `
      <label class="f">이메일<input type="email" id="email" autocomplete="email" inputmode="email" placeholder="you@example.com" value="${esc(auth.email)}"></label>
      <button class="btn primary big" id="send" ${auth.busy ? "disabled" : ""}>${auth.busy ? "보내는 중…" : "코드 받기"}</button>
      ${providers}` : `
      <p class="muted" style="margin:0"><b style="color:var(--ink)">${esc(auth.email)}</b>(으)로 코드를 보냈어요. 메일이 안 보이면 스팸함도 확인해 주세요.</p>
      ${auth.demoCode ? `<p class="notice">데모 모드예요. 코드 <b class="num">${esc(auth.demoCode)}</b>을 넣으세요.</p>` : ""}
      <label class="f">인증 코드<input type="text" id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="6자리 숫자"></label>
      <button class="btn primary big" id="verify" ${auth.busy ? "disabled" : ""}>${auth.busy ? "확인 중…" : "로그인"}</button>
      <div class="row" style="justify-content:space-between"><button class="link" id="back">이메일 다시 입력</button><button class="link" id="resend">코드 다시 보내기</button></div>`}
    <p class="muted" style="margin:0;font-size:12px">로그인하면 <a href="#/terms">이용약관</a>과 <a href="#/privacy">개인정보처리방침</a>에 동의한 것으로 봐요.</p>
  </section>`;
  const send = async () => {
    const email = ($("email") ? $("email").value : auth.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast("이메일 주소를 확인해 주세요"); return; }
    auth.email = email; auth.busy = true; renderLogin();
    try { const r = await b.sendCode(email); auth.demoCode = (r && r.demoCode) || ""; auth.stage = "code"; track("login_code_sent"); }
    catch (e) { toast(e.message || "코드를 보내지 못했어요", 2600); }
    auth.busy = false; renderLogin();
    const c = $("code"); if (c) c.focus();
  };
  if (auth.stage === "email") {
    $("send").onclick = send;
    $("email").onkeydown = e => { if (e.key === "Enter") send(); };
    document.querySelectorAll(".prov").forEach(x => x.onclick = async () => { try { await b.signInWithProvider(x.dataset.p); } catch (e) { toast(e.message, 2600); } });
  } else {
    const verify = async () => {
      const code = $("code").value.replace(/\D/g, "");
      if (code.length < 6) { toast("코드 6자리를 넣어 주세요"); return; }
      auth.busy = true; renderLogin();
      try {
        const u = await b.verifyCode(auth.email, code);
        SESSION.user = u; auth.stage = "email"; auth.busy = false; auth.demoCode = "";
        track("login"); toast("로그인했어요");
        const to = SESSION.returnTo || "#/home"; SESSION.returnTo = ""; go(to);
      } catch (e) { auth.busy = false; renderLogin(); toast(e.message || "로그인에 실패했어요", 2600); }
    };
    $("verify").onclick = verify;
    $("code").onkeydown = e => { if (e.key === "Enter") verify(); };
    $("code").focus();
    $("back").onclick = () => { auth.stage = "email"; renderLogin(); };
    $("resend").onclick = send;
  }
}

// ---------- Plans & payment ----------
export async function renderPlans() {
  const b = SESSION.backend;
  track("plans_view");
  $app().innerHTML = `<section class="sheet"><p class="muted" style="margin:0">요금제를 불러오는 중…</p></section>`;
  let plans = [];
  try { plans = await b.getPlans(); } catch (e) { $app().innerHTML = `<section class="sheet"><h2>요금제를 불러오지 못했어요</h2><p class="muted">${esc(e.message || "")}</p><button class="btn" onclick="location.reload()">다시 시도</button></section>`; return; }
  const ent = SESSION.ent, best = plans.reduce((m, p) => !m || p.price_krw / p.days < m.price_krw / m.days ? p : m, null);
  $app().innerHTML = `
  <section class="sheet">
    <span class="eyebrow">이용권</span>
    <h1 class="display">${total()}개 단어를 모두 열어요</h1>
    <p class="lead">자동 결제가 아니에요. 기간이 끝나면 그냥 끝나고, 배운 기록과 단어장은 그대로 남아요.</p>
    ${ent.active ? `<p class="notice">이용권 사용 중 · <b>${esc(fmtDate(ent.ends_at))}</b>까지. 지금 결제하면 끝나는 날부터 이어져요.</p>` : lockedCount() ? `<p class="notice">지금은 무료 단어 ${WORDS.length}개만 열려 있고 ${lockedCount().toLocaleString("ko-KR")}개가 잠겨 있어요.</p>` : ""}
    <div class="plans">${plans.map(p => `<button class="plan" data-id="${esc(p.id)}">
      ${best && p.id === best.id && plans.length > 1 ? `<span class="plan-tag">하루 ${Math.round(p.price_krw / p.days)}원 · 가장 저렴</span>` : `<span class="plan-tag muted">하루 ${Math.round(p.price_krw / p.days)}원</span>`}
      <span class="plan-name">${esc(p.name)}</span><span class="plan-price num">${won(p.price_krw)}</span><span class="plan-cta">${ent.active ? "연장하기" : "시작하기"}</span></button>`).join("")}</div>
    <ul class="incl">
      <li>단어·구동사·숙어·복합명사 ${total()}개 전부</li>
      <li>하루 새 단어 최대 50개, 목표 레벨 750점·900점+</li>
      <li>모든 기기에서 이어서 학습 (로그인 기준)</li>
    </ul>
    <p class="muted" style="margin:0;font-size:13px">결제는 토스페이먼츠를 통해 카드로 진행돼요. 결제 후 7일 이내에 유료 단어 학습을 시작하지 않았다면 전액 환불돼요. <a href="#/refund">환불규정</a></p>
  </section>
  <section class="sheet">
    <h2>자주 묻는 질문</h2>
    <details class="faq"><summary>무료로는 뭘 할 수 있나요?</summary><p>600점 단어 중심의 무료 단어 ${WORDS.length || 230}개를 하루 10개씩 배우고, 단어장·기록장·간격 복습을 모두 쓸 수 있어요.</p></details>
    <details class="faq"><summary>자동으로 결제되나요?</summary><p>아니요. 한 번 결제하면 기간만큼만 쓰고 끝나요. 연장하려면 직접 다시 결제해요.</p></details>
    <details class="faq"><summary>환불은 어떻게 하나요?</summary><p>결제 후 7일 이내에 유료 단어를 아직 배우지 않았다면 전액, 그 뒤에는 남은 기간만큼 일할 계산해 환불해요. ${esc(CONFIG.supportEmail)}로 주문번호와 함께 보내 주세요.</p></details>
    <details class="faq"><summary>기간이 끝나면 기록은요?</summary><p>배운 단어, 단어장, 점수 기록은 그대로 남아요. 유료 단어는 다시 잠기지만 이미 배운 단어의 복습은 계속할 수 있어요.</p></details>
  </section>`;
  document.querySelectorAll(".plan").forEach(x => x.onclick = () => buy(plans.find(p => p.id === x.dataset.id)));
}

async function buy(plan) {
  const b = SESSION.backend;
  if (!SESSION.user) { SESSION.returnTo = "#/plans"; toast("결제하려면 먼저 로그인해 주세요"); go("#/login"); return; }
  track("pay_start", { plan: plan.id });
  let order;
  try { order = await b.createOrder(plan.id); } catch (e) { toast(e.message || "주문을 만들지 못했어요", 2600); return; }
  if (b.mode === "local") { // demo: no real payment
    try { await b.demoPay(order); await flushSave(); await refreshAccess(); track("pay_done", { plan: plan.id, demo: true }); toast("데모 결제 완료! 이용권이 열렸어요", 2600); go("#/account"); }
    catch (e) { toast(e.message, 2600); }
    return;
  }
  try {
    const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
    const toss = await loadTossPayments(CONFIG.tossClientKey);
    const payment = toss.payment({ customerKey: SESSION.user.id });
    const ret = location.origin + BASE + "pay.html";
    await payment.requestPayment({
      method: "CARD",
      amount: { currency: "KRW", value: order.amount },
      orderId: order.order_id, orderName: order.order_name,
      successUrl: ret, failUrl: ret,
      customerEmail: SESSION.user.email,
      card: { useEscrow: false, flowMode: "DEFAULT", useCardPoint: false, useAppCardOnly: false },
    });
  } catch (e) {
    if (e && e.code === "USER_CANCEL") { toast("결제를 취소했어요"); return; }
    toast((e && e.message) || "결제창을 열지 못했어요", 2800);
  }
}

// ---------- Account ----------
let delStage = 0;
export async function renderAccount() {
  const b = SESSION.backend, u = SESSION.user, ent = SESSION.ent;
  const xfer = `<div class="xfer">
      <span class="eyebrow">기록 옮기기</span>
      <span class="muted">다른 기기나 예전 앱의 학습 기록을 옮길 때 써요. 로그인하면 자동으로 동기화되니 평소에는 쓸 일이 없어요.</span>
      <div class="row"><button class="btn" id="exportBtn">내 기록 복사</button><button class="btn" id="importBtn">붙여넣은 기록 불러오기</button></div>
      <textarea id="xferBox" rows="3" placeholder="복사한 기록을 여기에 붙여넣으세요"></textarea>
    </div>`;
  if (!u) {
    $app().innerHTML = `<section class="sheet">
      <h2>내 정보</h2>
      <p class="muted" style="margin:0">지금은 로그인하지 않은 상태예요. 학습 기록은 이 브라우저에만 저장돼요. 로그인하면 기록이 계정에 저장되고 다른 기기에서도 이어서 할 수 있어요.</p>
      <a class="btn primary big" href="#/login">이메일로 로그인</a>
      <a class="btn" href="#/plans">이용권 보기</a>
      ${xfer}
    </section>
    ${legalLinks()}`;
    bindXfer();
    return;
  }
  $app().innerHTML = `<section class="sheet">
    <h2>내 정보</h2>
    <div class="kv"><span>이메일</span><b>${esc(u.email || "")}</b></div>
    <div class="kv"><span>이용권</span><b>${ent.active ? `사용 중 · ${esc(fmtDate(ent.ends_at))}까지` : "없음 (무료)"}</b></div>
    <div class="row"><a class="btn ${ent.active ? "" : "primary"}" href="#/plans">${ent.active ? "이용권 연장" : "이용권 구매"}</a><button class="btn" id="logout">로그아웃</button></div>
  </section>
  <section class="sheet" id="orders"><h2>결제 내역</h2><p class="muted" style="margin:0">불러오는 중…</p></section>
  <section class="sheet">${xfer}</section>
  <section class="sheet danger">
    <h2>회원 탈퇴</h2>
    <p class="muted" style="margin:0">계정과 학습 기록이 모두 삭제돼요. 남은 이용권은 <a href="#/refund">환불규정</a>에 따라 환불돼요. 결제 기록은 법령에 따라 5년간 보관돼요.</p>
    <button class="btn" id="del">${delStage ? "정말 탈퇴할까요? 한 번 더 누르면 삭제돼요" : "회원 탈퇴"}</button>
  </section>
  ${legalLinks()}`;
  bindXfer();
  $("logout").onclick = async () => { await flushSave(); await b.signOut(); SESSION.user = null; delStage = 0; toast("로그아웃했어요"); go("#/home"); };
  $("del").onclick = async () => {
    if (!delStage) { delStage = 1; renderAccount(); return; }
    try { await b.deleteAccount(); SESSION.user = null; delStage = 0; replaceState(blank()); toast("탈퇴했어요. 그동안 고마웠어요", 3000); go("#/welcome"); }
    catch (e) { toast(e.message || "탈퇴 처리에 실패했어요", 2800); }
  };
  try {
    const orders = await b.listOrders();
    const el = $("orders"); if (!el) return;
    const st = { paid: "결제 완료", pending: "진행 중", failed: "실패", canceled: "취소·환불" };
    el.innerHTML = `<h2>결제 내역</h2>${orders.length ? orders.map(o => `<div class="entry"><div class="entry-head"><b>${esc(o.order_name)}</b><span class="badge ${o.status === "paid" ? "grad" : ""}">${st[o.status] || esc(o.status)}</span></div><div class="muted num">${won(o.amount)} · ${esc(fmtDate(o.created_at))} · 주문번호 ${esc(o.order_id)}</div></div>`).join("") : `<p class="muted" style="margin:0">아직 결제 내역이 없어요.</p>`}
      <p class="muted" style="margin:0;font-size:12px">환불이나 영수증 문의: ${esc(CONFIG.supportEmail)}</p>`;
  } catch (e) { const el = $("orders"); if (el) el.innerHTML = `<h2>결제 내역</h2><p class="muted">불러오지 못했어요.</p>`; }
}
function legalLinks() { return `<p class="muted" style="margin:0;font-size:13px;text-align:center"><a href="#/terms">이용약관</a> · <a href="#/privacy">개인정보처리방침</a> · <a href="#/refund">환불규정</a> · 문의 ${esc(CONFIG.supportEmail)}</p>`; }
function bindXfer() {
  const xb = $("xferBox");
  $("exportBtn").onclick = () => {
    const txt = JSON.stringify(S); xb.value = txt; xb.select();
    try { navigator.clipboard.writeText(txt).then(() => toast("기록을 복사했어요"), () => toast("아래 칸의 글자를 길게 눌러 복사하세요")); } catch (e) { toast("아래 칸의 글자를 길게 눌러 복사하세요"); }
  };
  $("importBtn").onclick = () => {
    let d; try { d = JSON.parse(xb.value.trim()); } catch (e) { d = null; }
    if (!d || typeof d !== "object" || !d.learned) { toast("붙여넣은 기록을 읽지 못했어요. 복사한 글자 전체를 붙여넣어 주세요", 2600); return; }
    replaceState(d); flushSave(); toast("기록을 불러왔어요"); go("#/home");
  };
}

// ---------- Legal ----------
export function renderLegal(kind) {
  const html = kind === "privacy" ? privacyHtml() : kind === "refund" ? refundHtml() : termsHtml();
  $app().innerHTML = `<section class="sheet legal">${html}<p><a href="#/home" class="link">← 돌아가기</a></p></section>`;
  window.scrollTo(0, 0);
}

// ---------- Error ----------
export function renderError(e) {
  const msg = (e && e.message) || String(e || "");
  $app().innerHTML = `<section class="sheet">
    <h2>앱을 불러오지 못했어요</h2>
    <p class="muted" style="margin:0">인터넷 연결을 확인하고 다시 시도해 주세요. 계속 안 되면 ${esc(CONFIG.supportEmail)}로 알려 주세요.</p>
    ${msg ? `<p class="muted num" style="margin:0;font-size:12px">${esc(msg)}</p>` : ""}
    <button class="btn primary" onclick="location.reload()">다시 시도</button>
  </section>`;
}

