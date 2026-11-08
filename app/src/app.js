// Study views: home, course/free-study runs (card, ordering, blank quiz, translation quiz), done, score log, word book.
// Ported from the validated prototype; adds free-tier gating and a shared session.
import { WORDS, BY, HL, HLKO, PARTS, GLOSS, QOPT, TRAPS, VTRAPS, CATALOG, LV_NAME, LV_RANK, isExpr, lvOf, sentence, lockedCount } from "./content.js";
import { S, save, today, addDays, replaceState, parseBackup } from "./state.js";
import { esc, shuffle, toast, speak, $ } from "./ui.js";
import { CONFIG } from "./config.js";
import { SESSION, go, track } from "./session.js";

const $app = () => $("app");
const entitled = () => SESSION.entitled;
const effPerDay = () => entitled() ? S.perDay : Math.min(S.perDay, CONFIG.free.perDayMax);
const effGoal = () => { const g = S.goal || "all"; return entitled() || CONFIG.free.goals.includes(g) ? g : "all"; };
const LVS = () => ["600", "750", "900"].filter(l => CATALOG.some(x => x.lv === l)); // levels this build has
const LOCK = `<svg class="lock" viewBox="0 0 16 16" width="12" height="12" aria-label="이용권 필요"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;

// ---------- Spaced repetition: 1→3→7→14→30→60 days when right, next day when wrong ----------
const IV = [1, 3, 7, 14, 30, 60];
function srsSet(id, box) { S.srs = S.srs || {}; const b = Math.max(0, Math.min(box, IV.length - 1)); S.srs[id] = { box: b, due: addDays(today(), IV[b]), last: today() }; }
function srsHit(id) { if (!S.learned[id]) return; const e = (S.srs || {})[id]; if (!e) return srsSet(id, 1); if (e.last === today() || e.due > today()) return; srsSet(id, e.box + 1); }
function srsMiss(id) { if (!S.learned[id]) return; srsSet(id, 0); }
const dueIds = () => Object.entries(S.srs || {}).filter(([id, e]) => BY[id] && S.learned[id] && e.due <= today()).sort((a, b) => a[1].due.localeCompare(b[1].due) || a[1].box - b[1].box).map(([id]) => id);

// Every 4 new words, mix in one expression (구동사·숙어·복합명사)
function mixIn(ws) { const a = ws.filter(w => !isExpr(w)), e = ws.filter(isExpr), out = []; let i = 0, j = 0; while (i < a.length || j < e.length) { for (let k = 0; k < 4 && i < a.length; k++) out.push(a[i++]); if (j < e.length) out.push(e[j++]); } return out; }
function freshPool() { const g = effGoal(); let ws = WORDS.filter(w => !S.learned[w.id]); if (g !== "all") { ws = ws.filter(w => LV_RANK[lvOf(w.id)] <= LV_RANK[g]); ws = ws.map((w, i) => [w, i]).sort((a, b) => LV_RANK[lvOf(a[0].id)] - LV_RANK[lvOf(b[0].id)] || a[1] - b[1]).map(x => x[0]); } return mixIn(ws); }
const STEP_NAMES = { card: "암기카드", order: "문장 배열", quiz: "빈칸 퀴즈", trans: "해석 퀴즈", mix: "섞어서", review: "간격 복습" };
const KINDS = ["order", "quiz", "trans"];
const randKind = () => KINDS[Math.floor(Math.random() * KINDS.length)];
const active = () => Object.values(S.book).filter(e => !e.grad);

// ---------- Wrong-word book ----------
function recordMiss(key, info) {
  if (BY[key]) srsMiss(key);
  const e = S.book[key] || (S.book[key] = { key, word: info.word, ko: info.ko || "", count: 0, streak: 0, grad: false, sentences: [], confused: [] });
  e.count++; e.streak = 0; e.grad = false; e.updated = Date.now();
  if (info.en && !e.sentences.some(s => s.en === info.en)) e.sentences.unshift({ en: info.en, ko: info.tr || "", from: info.from });
  if (info.confused && !e.confused.includes(info.confused)) e.confused.push(info.confused);
  save();
}
function recordHit(key) {
  if (BY[key]) srsHit(key);
  const e = S.book[key]; if (!e || e.grad) return;
  e.streak++; if (e.streak >= 3) { e.grad = true; toast("'" + e.word + "' 졸업! 3번 연속 맞혔어요"); }
  save();
}

// ---------- Sessions ----------
let run = null; // {kind:'course'|'free', steps, ids, step, idx, answered, ...}
export let view = "home"; // home | run | done
export function resetRun() { run = null; view = "home"; }

function buildCourse() {
  const review = active().filter(e => BY[e.key]).sort((a, b) => b.count - a.count).slice(0, 4).map(e => e.key);
  const fresh = freshPool().filter(w => !review.includes(w.id)).slice(0, effPerDay()).map(w => w.id);
  const ids = [...review, ...fresh];
  let rev = dueIds().filter(id => !ids.includes(id)).slice(0, 30);
  if (rev.length < 5) rev = rev.concat(shuffle(Object.keys(S.learned).filter(id => BY[id] && !ids.includes(id) && !rev.includes(id))).slice(0, 5 - rev.length));
  rev = shuffle(rev);
  const steps = ["card", "order", "quiz"].concat(rev.length ? ["review"] : []);
  S.course = { date: today(), ids, fresh, steps, lists: { quiz: shuffle(ids), review: rev }, mk: { review: rev.map(randKind) }, step: 0, idx: 0, done: false };
  save();
}
function startCourse() {
  if (!S.course || S.course.date !== today()) buildCourse();
  if (!S.course.ids.length && !(S.course.lists.review || []).length) {
    if (!entitled() && lockedCount()) { toast("무료 단어를 모두 배웠어요. 이용권으로 나머지 단어를 열 수 있어요", 2600); go("#/plans"); return; }
    toast(CONFIG.freeOnly ? "베타 단어를 모두 배웠어요. 선택 학습으로 복습해 보세요" : "이 레벨의 새 단어를 모두 배웠어요. 목표 레벨을 올리거나 선택 학습으로 복습해 보세요", 2600); return;
  }
  if (!S.course.ids.length) { S.course.steps = ["review"]; S.course.step = 0; }
  run = { kind: "course", steps: S.course.steps || ["card", "order", "quiz"] };
  track("course_start", { fresh: S.course.fresh.length });
  view = "run"; render();
}
function startFree(activity, scope) {
  if (!entitled() && scope.startsWith("lv") && !CONFIG.free.goals.includes(scope.slice(2))) { toast("이 레벨은 이용권이 있어야 열려요", 2200); go("#/plans"); return; }
  let ids = scope === "book" ? active().filter(e => BY[e.key]).map(e => e.key) : scope === "learned" ? Object.keys(S.learned).filter(id => BY[id]) : scope === "due" ? dueIds() : scope.startsWith("pos:") ? WORDS.filter(w => w.pos === scope.slice(4)).map(w => w.id) : scope.startsWith("lv") ? WORDS.filter(w => lvOf(w.id) === scope.slice(2)).map(w => w.id) : WORDS.map(w => w.id);
  ids = shuffle(ids).slice(0, 10);
  if (!ids.length) {
    if (!entitled() && lockedCount() && (scope.startsWith("lv") || scope.startsWith("pos:") || scope === "all")) { toast("이 범위는 이용권이 있어야 열려요", 2200); go("#/plans"); return; }
    toast(scope === "book" ? "단어장이 비어 있어요" : scope === "due" ? "오늘 복습할 단어가 없어요" : "아직 배운 단어가 없어요"); return;
  }
  run = { kind: "free", steps: [activity], ids, step: 0, idx: 0, mk: { mix: ids.map(randKind) } };
  track("free_start", { activity, scope });
  view = "run"; render();
}
function cur() { return run.kind === "course" ? S.course : run; }
function stepIds(c) { const k = run.steps[c.step]; return (c.lists && c.lists[k]) || c.ids; }
function kindAt(c) { const k = run.steps[c.step]; return (k === "mix" || k === "review") ? ((c.mk && c.mk[k] || [])[c.idx] || "quiz") : k; }
function advance() {
  const c = cur(); c.idx++; run.answered = false; run.placed = null; run.flipped = false; run.added = {}; run.peek = false; run.opts = null; run.topts = null; run.pick = null;
  if (c.idx >= stepIds(c).length) { c.idx = 0; c.step++; }
  if (c.step >= run.steps.length) {
    if (run.kind === "course") { c.fresh.forEach(id => { S.learned[id] = today(); srsSet(id, 0); }); c.done = true; track("course_done", { fresh: c.fresh.length }); }
    save(); view = "done"; render(); return;
  }
  if (run.kind === "course") save();
  render();
}

// ---------- Views ----------
export function render() {
  if (view === "run") return renderRun();
  if (view === "done") return renderDone();
  renderHome();
}

let settingsOpen = false;
function renderHome() {
  const learned = Object.keys(S.learned).length, bookN = active().length, dueN = dueIds().length, locked = lockedCount();
  let dd = "";
  if (S.examDate) { const diff = Math.round((new Date(S.examDate + "T00:00") - new Date(today() + "T00:00")) / 864e5); dd = diff > 0 ? "D-" + diff : diff === 0 ? "D-DAY" : "시험 종료"; }
  const c = S.course && S.course.date === today() ? S.course : null;
  const csteps = (c && c.steps) || ["card", "order", "quiz"];
  const stepState = k => { if (!c) return ""; const i = csteps.indexOf(k); return c.done || c.step > i ? "done" : c.step === i ? "on" : ""; };
  const courseLabel = !c ? "오늘 코스 시작" : c.done ? "오늘 코스 다시 하기" : (c.step || c.idx) ? "이어서 하기" : "오늘 코스 시작";
  const perDay = effPerDay();
  const lvRows = LVS().map(l => {
    const all = CATALOG.filter(x => x.lv === l), got = all.filter(x => S.learned[x.id]).length, open = WORDS.filter(w => lvOf(w.id) === l).length;
    return `<div class="lvrow"><span class="lvb">${LV_NAME[l]}</span><span class="bar"><i style="width:${all.length ? Math.round(got / all.length * 100) : 0}%"></i></span><span class="cnt">${got} / ${all.length}${open < all.length ? " " + LOCK : ""}</span></div>`;
  }).join("");
  const goalName = { all: "전체", 600: "600점", 750: "750점", 900: "900점+" }[effGoal()], lvName = { easy: "쉬움", normal: "보통", hard: "어려움" }[S.level || "normal"];
  const fresh = freshPool().length;
  const upsell = !entitled() && locked ? `
  <section class="sheet upsell">
    <div class="upsell-row">
      <div><span class="eyebrow">이용권</span><b>${fresh ? "단어 " + locked.toLocaleString("ko-KR") + "개가 더 있어요" : "무료 단어를 모두 배웠어요"}</b>
      <p class="muted" style="margin:0">${fresh ? "무료 단어 " + WORDS.length + "개로 먼저 써 보고, 마음에 들면 전체 " + CATALOG.length.toLocaleString("ko-KR") + "개를 열어요." : "이용권으로 나머지 " + locked.toLocaleString("ko-KR") + "개를 열고 750점·900점+ 단어까지 이어서 배워요."}</p></div>
      <a class="btn primary" href="#/plans">이용권 보기</a>
    </div>
  </section>` : "";
  $app().innerHTML = `
  <section class="sheet hero">
    <div class="hero-top">
      <div class="dday"><span class="eyebrow">시험까지</span><span class="big${dd ? "" : " unset"}">${dd || "D-?"}</span><span class="muted">${S.examDate ? "시험일 " + esc(S.examDate) : "아래 학습 설정에서 시험일을 정해 주세요"}</span></div>
      <div class="seal"><b>${learned}</b><span>/ ${CATALOG.length.toLocaleString("ko-KR")} 배움</span></div>
    </div>
    <div class="course">
      <div class="course-head"><h2>오늘의 코스</h2><span class="muted num">${perDay}개</span></div>
      <p class="muted" style="margin:0">${c ? "오답 복습 " + (c.ids.length - c.fresh.length) + "개 + 새 단어 " + c.fresh.length + "개" + (c.lists && c.lists.review && c.lists.review.length ? " + 간격 복습 " + c.lists.review.length + "문제" : "") : "틀린 단어 최대 4개를 먼저 복습하고, 새 단어 " + perDay + "개를 배워요. 마지막에는 지금까지 배운 단어로 랜덤 문제가 나와요."}</p>
      <div class="steps">${csteps.map(k => `<span class="step ${stepState(k)}">${STEP_NAMES[k]}</span>`).join("")}${!c && learned ? `<span class="step">간격 복습${dueN ? " " + dueN : ""}</span>` : ""}</div>
      <button class="btn primary big" id="go">${courseLabel}</button>
    </div>
  </section>
  ${upsell}
  <section class="sheet">
    <span class="eyebrow">학습 현황</span>
    <div class="stats">
      <div class="stat"><b>${learned}</b><span>배운 단어</span></div>
      <div class="stat${dueN ? " hot" : ""}"><b>${dueN}</b><span>오늘 복습</span></div>
      <div class="stat${bookN ? " hot" : ""}"><b>${bookN}</b><span>남은 오답</span></div>
      <div class="stat"><b>${Object.values(S.book).filter(e => e.grad).length}</b><span>졸업한 단어</span></div>
    </div>
    <div class="lvbars">${lvRows}</div>
  </section>
  <section class="sheet">
    <h2>선택 학습</h2>
    <div class="row">
      <label class="f">활동<select id="act"><option value="mix">섞어서 (모든 유형)</option><option value="order">문장 배열</option><option value="quiz">빈칸 퀴즈</option><option value="trans">해석 퀴즈</option><option value="card">암기카드</option></select></label>
      <label class="f">범위<select id="scope"><option value="book">나만의 단어장</option><option value="learned">배운 단어</option><option value="due">오늘 복습할 단어</option>${LVS().map(l => `<option value="lv${l}">${LV_NAME[l]} 단어${entitled() || CONFIG.free.goals.includes(l) ? "" : " · 이용권"}</option>`).join("")}<option value="pos:구동사">구동사</option><option value="pos:숙어">숙어·관용 표현</option><option value="pos:복합명사">복합명사</option><option value="all">전체 단어</option></select></label>
    </div>
    <button class="btn" id="free">10문제 시작</button>
  </section>
  <details class="sheet settings" id="settings" ${(settingsOpen || !S.examDate) ? "open" : ""}>
    <summary>학습 설정<span class="muted">${goalName} · 배열 ${lvName}</span></summary>
    <div class="settings-body">
      <div class="row">
        <label class="f">시험일<input type="date" id="exam" value="${esc(S.examDate)}"></label>
        <label class="f">하루 새 단어<select id="perday">${[10, 20, 30, 40, 50].map(n => `<option value="${n}" ${n == perDay ? "selected" : ""} ${!entitled() && n > CONFIG.free.perDayMax ? "disabled" : ""}>${n}${!entitled() && n > CONFIG.free.perDayMax ? " · 이용권" : ""}</option>`).join("")}</select></label>
      </div>
      <label class="f"${LVS().length < 2 ? " hidden" : ""}>목표 레벨 (새 단어 순서)<select id="goal">${[["all", "전체 · 기본 순서"], ["600", "600점 · 기초 단어만"], ["750", "750점 · 기초 → 중급"], ["900", "900점+ · 쉬운 단어부터 전부"]].filter(([v]) => v === "all" || LVS().includes(v)).map(([v, t]) => `<option value="${v}" ${effGoal() === v ? "selected" : ""} ${!entitled() && !CONFIG.free.goals.includes(v) ? "disabled" : ""}>${t}${!entitled() && !CONFIG.free.goals.includes(v) ? " · 이용권" : ""}</option>`).join("")}</select></label>
      <label class="f">문장 배열 난이도<select id="level"><option value="easy" ${S.level === "easy" ? "selected" : ""}>쉬움 · 표현 덩어리로 묶음</option><option value="normal" ${(S.level || "normal") === "normal" ? "selected" : ""}>보통 · 한 단어씩</option><option value="hard" ${S.level === "hard" ? "selected" : ""}>어려움 · 함정 블록 포함</option></select></label>
      <label class="toggle"><input type="checkbox" id="hint" ${S.hint !== false ? "checked" : ""}> 문장 배열에서 오늘의 단어 힌트 보여주기</label>
      ${!SESSION.user ? `<div class="xfer">
        <span class="eyebrow">기록 백업</span>
        <p class="muted" style="margin:0">학습 기록은 이 브라우저에만 있어요. 브라우저 데이터를 지우거나 기기를 바꾸기 전에 복사해 두고, 나중에 붙여넣어 불러오세요.</p>
        <div class="row"><button class="btn" id="bk-copy">내 기록 복사</button><button class="btn" id="bk-load">붙여넣은 기록 불러오기</button></div>
        <textarea id="bk-text" rows="3" placeholder="복사한 기록을 여기에 붙여넣으세요" aria-label="백업한 학습 기록"></textarea>
      </div>` : ""}
      ${!entitled() ? `<p class="muted" style="margin:0">하루 새 단어 20개 이상과 750점·900점+ 목표는 <a href="#/plans">이용권</a>이 있어야 쓸 수 있어요.</p>` : ""}
    </div>
  </details>`;
  $("settings").ontoggle = e => { settingsOpen = e.target.open; };
  $("exam").onchange = e => { S.examDate = e.target.value; save(); render(); };
  $("level").onchange = e => { S.level = e.target.value; save(); };
  $("goal").onchange = e => { S.goal = e.target.value; if (S.course && S.course.date === today() && !S.course.step && !S.course.idx) S.course = null; save(); render(); };
  $("hint").onchange = e => { S.hint = e.target.checked; save(); };
  $("perday").onchange = e => { S.perDay = +e.target.value; if (S.course && S.course.date === today() && !S.course.step && !S.course.idx) S.course = null; save(); render(); };
  $("go").onclick = () => { if (c && c.done) { S.course = null; } startCourse(); };
  $("free").onclick = () => startFree($("act").value, $("scope").value);
  if ($("bk-copy")) bindBackup();
}

// Guest backup: the whole learner state as one JSON string the person keeps (clipboard or a note app).
function bindBackup() {
  const box = $("bk-text");
  $("bk-copy").onclick = async () => {
    const txt = JSON.stringify(S); box.value = txt;
    try { await navigator.clipboard.writeText(txt); toast("기록을 복사했어요. 메모 앱 등에 붙여넣어 보관하세요", 2400); }
    catch (e) { box.focus(); box.select(); toast("아래 글자를 모두 선택해서 복사해 주세요", 2400); }
  };
  $("bk-load").onclick = () => {
    const data = parseBackup(box.value.trim());
    if (!data) { toast("기록 형식이 맞지 않아요. 복사한 글자를 빠짐없이 붙여넣어 주세요", 2600); return; }
    const n = Object.keys(data.learned || {}).length;
    if (!confirm(`배운 단어 ${n}개가 담긴 기록으로 바꿀까요? 지금 이 기기의 기록은 사라져요.`)) return;
    replaceState(data); box.value = ""; toast("기록을 불러왔어요", 2000); render();
  };
}

function runHeader() {
  const c = cur(), step = run.steps[c.step], kind = kindAt(c), n = stepIds(c).length;
  const lens = run.steps.map((k, i) => { const keep = c.step; c.step = i; const l = stepIds(c).length; c.step = keep; return l; });
  const total = lens.reduce((a, b) => a + b, 0), pos = lens.slice(0, c.step).reduce((a, b) => a + b, 0) + c.idx;
  return `<div class="runhead">
    <div class="steps">${run.steps.map((k, i) => `<span class="step ${i < c.step ? "done" : i === c.step ? "on" : ""}">${STEP_NAMES[k]}</span>`).join("")}</div>
    <button class="link" id="quit">그만하기</button></div>
    <div class="progress"><i style="width:${Math.round(pos / total * 100)}%"></i></div>
    <p class="muted num" style="margin:0">${step !== kind ? STEP_NAMES[step] + " · " : ""}${STEP_NAMES[kind]} ${c.idx + 1} / ${n}</p>`;
}
function bindHeader() { $("quit").onclick = () => { run = null; view = "home"; render(); window.scrollTo(0, 0); }; }

function glossBox(w, k) {
  const g = (GLOSS[w.id] || {})[k] || []; if (!g.length) return "";
  return `<div class="gloss"><span class="gl-t">문장 속 다른 단어</span>${g.map(([a, b]) => `<span><b>${esc(a)}</b> : ${esc(b)}</span>`).join("")}</div>`;
}
function collLine(w) {
  const h = HL[w.id]; if (!h) return ""; const ps = PARTS[w.id] || [];
  return `<span class="en"><mark class="coll" style="font-weight:600">${esc(h)}</mark> : ${esc(HLKO[w.id] || "")}</span>` + (ps.length ? `<span class="parts">${ps.map(([a, b]) => `<span><b>${esc(a)}</b> : ${esc(b)}</span>`).join("")}</span>` : "");
}
function markColl(w) { const en = sentence(w), h = HL[w.id] || "", i = h ? en.toLowerCase().indexOf(h.toLowerCase()) : -1; if (i < 0) return esc(en); return esc(en.slice(0, i)) + `<mark class="coll">${esc(en.slice(i, i + h.length))}</mark>` + esc(en.slice(i + h.length)); }

const SPECIAL_KEY = { "in-charge-of": { text: "in charge of", ko: "~을 담당하는" }, "carry-out": { text: "carry out", ko: "수행하다, 실시하다" }, "short-notice": { text: "short notice", ko: "촉박한 통보 (on such short notice: 그렇게 촉박하게)" } };
function srcOf(w, kind) {
  return kind === "q" ? { en: w.q.replace("___", w.opts[0]), tr: w.qko, key: SPECIAL_KEY[w.id] || { text: w.opts[0], ko: w.ko }, gl: (GLOSS[w.id] || {}).q || [] }
    : { en: sentence(w), tr: w.tr, key: HL[w.id] ? { text: HL[w.id], ko: HLKO[w.id] || "" } : null, gl: (GLOSS[w.id] || {}).o || [] };
}
function units(w, kind) {
  // Split the sentence into study units: the key expression, glossed chunks, then single words.
  const src = srcOf(w, kind), toks = src.en.split(" ");
  const norm = t => t.toLowerCase().replace(/[^a-z0-9'.\-é]/g, "").replace(/\.$/, "");
  const cands = [];
  if (src.key) cands.push({ ...src.key, key: true });
  src.gl.forEach(([a, b]) => { const t = a.replace(/\s*~(ing)?$/, "").replace(/^~\s*/, "").trim(); if (t) cands.push({ text: t, ko: b.replace(/\s*\(.*\)$/, "") }); });
  cands.sort((x, y) => y.text.split(" ").length - x.text.split(" ").length);
  const used = new Array(toks.length).fill(null);
  cands.forEach(c => {
    const parts = c.text.split(" ").map(norm);
    for (let i = 0; i + parts.length <= toks.length; i++) {
      if (parts.every((p, j) => norm(toks[i + j]) === p && used[i + j] === null)) { for (let j = 0; j < parts.length; j++) used[i + j] = c; break; }
    }
  });
  const out = []; let i = 0;
  while (i < toks.length) {
    const c = used[i];
    if (c) { let j = i; while (j < toks.length && used[j] === c) j++; out.push({ show: toks.slice(i, j).join(" "), word: c.text, ko: c.ko, key: !!c.key }); i = j; }
    else { out.push({ show: toks[i], word: toks[i].replace(/[^A-Za-z'\-é]/g, ""), ko: "", key: false }); i++; }
  }
  if (kind === "q") ((run && run.opts) || w.opts).forEach(o => o === w.opts[0] ? out.push({ show: o, word: o, ko: w.ko, opt: true, key: true }) : out.push({ show: o, word: o, ko: (QOPT[w.id] || {})[o] || "", opt: true }));
  return out;
}
function tapWords(w, kind) {
  const us = units(w, kind);
  const btn = (u, i) => u.word ? `<button class="w ${u.word.includes(" ") ? "chunk" : ""} ${run.added && run.added[i] ? "added" : ""}" data-i="${i}">${esc(u.show)}</button>` : `<span>${esc(u.show)}</span>`;
  const sent = us.map((u, i) => [u, i]).filter(([u]) => !u.opt), opts = us.map((u, i) => [u, i]).filter(([u]) => u.opt);
  return `<div class="muted" style="font-size:13px">모르는 단어나 표현이 있었다면 눌러서 단어장에 담으세요. 다시 누르면 취소돼요</div>
  <div class="words">${sent.map(([u, i]) => btn(u, i)).join("")}</div>
  ${opts.length ? `<div class="muted" style="font-size:13px">선택지 중 모르는 단어 <span style="font-size:12px">(맞혔어도 확실하지 않으면 정답 단어도 담으세요)</span></div><div class="words">${opts.map(([u, i]) => btn(u, i)).join("")}</div>` : ""}`;
}
function bindTapWords(w, kind) {
  const us = units(w, kind), src = srcOf(w, kind);
  document.querySelectorAll(".w").forEach(b => b.onclick = () => {
    const u = us[+b.dataset.i]; run.added = run.added || {};
    const isMain = u.word.toLowerCase() === w.w.toLowerCase() || (kind === "q" && u.key);
    const word = isMain ? w.w : u.word;
    const key = isMain ? w.id : "c:" + word.toLowerCase();
    const prev = run.added[b.dataset.i];
    if (prev) { // second tap: undo exactly what this tap added
      if (prev.before) S.book[key] = prev.before; else delete S.book[key];
      delete run.added[b.dataset.i]; b.classList.remove("added"); save();
      toast("'" + word + "' 담기를 취소했어요"); return;
    }
    run.added[b.dataset.i] = { before: S.book[key] ? JSON.parse(JSON.stringify(S.book[key])) : null }; b.classList.add("added");
    recordMiss(key, { word, ko: isMain ? w.ko : u.ko, en: src.en, tr: src.tr, from: u.opt ? "선택지에서 담음" : "직접 담음" });
    if (S.book[key] && !S.book[key].ko && u.ko) { S.book[key].ko = u.ko; save(); }
    toast("'" + word + "'을(를) 문장과 함께 담았어요");
  });
}

function renderRun() {
  const c = cur(), kind = kindAt(c), w = BY[stepIds(c)[c.idx]];
  if (!w) { advance(); return; }
  if (kind === "trans") return renderTrans(w);
  if (kind === "card") return renderCard(w);
  if (kind === "order") return renderOrder(w);
  renderQuiz(w);
}

function renderCard(w) {
  const f = run.flipped;
  $app().innerHTML = `<section class="sheet">${runHeader()}</section>
  <section class="sheet card" id="card" role="button" tabindex="0" aria-label="카드 뒤집기">
    <div class="word">${esc(w.w)}</div><div class="pos">${esc(w.pos)} · <span class="lvb">${LV_NAME[lvOf(w.id)]}</span></div>
    ${f ? `<div class="meaning">${esc(w.ko)}</div>
      <div><span class="coll">${esc(w.coll)}</span></div>
      <div class="sent" style="text-align:left">${esc(sentence(w))}<span>${esc(w.tr)}</span></div>`
      : `<div class="tapnote">뜻을 떠올린 뒤 눌러서 확인</div>`}
  </section>
  <div class="row"><button class="btn" id="say">발음 듣기</button></div>
  ${f ? `<div class="row"><button class="btn" id="no">모르겠어요</button><button class="btn primary" id="yes">알아요</button></div>` : ""}`;
  bindHeader();
  const flip = () => { if (!run.flipped) { run.flipped = true; render(); } };
  const card = $("card"); card.onclick = flip; card.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } };
  $("say").onclick = () => speak(w.w);
  if (f) {
    $("yes").onclick = advance;
    $("no").onclick = () => { recordMiss(w.id, { word: w.w, ko: w.ko, en: sentence(w), tr: w.tr, from: "암기카드" }); toast("나만의 단어장에 담았어요"); advance(); };
  }
}

function trapSet(w) { return run && run.ts === "v" ? VTRAPS[w.id] : TRAPS[w.id]; }
function trapLine(w) { const T = trapSet(w); if (!T) return ""; const v = run.ts === "v"; return `<div class="gloss"><span class="gl-t">파트5 ${v ? "어휘" : "문법"} 함정 풀이</span><span><b>${esc(T.a)}</b> : 정답</span>${T.t.map(([x, r]) => `<span><s>${esc(x)}</s> : ${esc(r)}</span>`).join("")}${v ? `<span class="muted">모두 문법적으로는 들어갈 수 있어서, 뜻을 알아야 고를 수 있어요</span>` : ""}</div>`; }
function renderOrder(w) {
  const lv = S.level || "normal";
  if (!run.placed) {
    const base = lv === "easy" ? w.chunks : sentence(w).split(" ");
    run.ts = Math.random() < 0.5 ? "v" : "g";
    const traps = lv === "hard" ? ((trapSet(w) || {}).t || []).map(x => x[0]) : [];
    run.pool = shuffle(base.map(t => ({ t })).concat(traps.map(t => ({ t, trap: true }))));
    if (run.pool.map(p => p.t).join(" ") === sentence(w)) run.pool.reverse();
    run.placed = []; run.tries = 0; run.retry = false; run.lv = lv;
  }
  const hard = run.lv === "hard";
  const done = hard ? run.placed.length > 0 : run.pool.length === 0;
  const tile = (p, where, k) => `<button class="tile" data-where="${where}" data-k="${k}" ${run.answered ? "disabled" : ""}>${esc(p.t)}</button>`;
  let fb = "";
  if (run.answered) {
    fb = run.correct ? `<div class="fb ok"><b>${run.tries > 1 ? "두 번째에 맞혔어요" : "정답이에요"}</b><span class="en">${markColl(w)}</span>${collLine(w)}${glossBox(w, "o")}${hard ? trapLine(w) : ""}</div>`
      : `<div class="fb no"><b>두 번 모두 틀렸어요. 원래 문장을 보고 단어장에 담았어요</b><span class="en">${markColl(w)}</span>${collLine(w)}${glossBox(w, "o")}${hard ? trapLine(w) : ""}</div>`;
  } else if (run.retry) {
    fb = `<div class="fb no"><b>순서가 달라요. 한 번 더 해보세요</b><span class="muted">블록을 눌러서 옮기면 고칠 수 있어요</span></div>`;
  }
  $app().innerHTML = `<section class="sheet">${runHeader()}</section>
  <section class="sheet">
    <div class="hintrow">${(S.hint !== false || run.peek || run.answered) ? `<div class="pos">오늘의 단어 <b style="color:var(--ink)">${esc(w.w)}</b> · ${esc(w.ko)}</div>` : `<div class="pos">힌트 꺼짐</div>`}${run.answered ? "" : `<button class="link" id="hinttoggle">${S.hint !== false ? "힌트 끄기" : run.peek ? "다시 가리기" : "힌트 보기"}</button>`}</div>
    <div class="prompt">${esc(w.tr)}</div>
    ${hard && !run.answered ? `<div class="muted" style="font-size:13px">파트5처럼 ${run.ts === "v" ? "뜻을 알아야 고를 수 있는" : "형태가 비슷한"} 단어 ${((trapSet(w) || {}).t || []).length}개가 함정으로 섞여 있어요. 블록을 다 쓰지 않아도 돼요</div>` : ""}
    <div class="line" aria-label="내가 만든 문장">${run.placed.map((p, k) => tile(p, "line", k)).join("")}</div>
    <div class="pool" aria-label="단어 블록">${run.pool.map((p, k) => tile(p, "pool", k)).join("")}</div>
    ${fb}
    ${run.answered ? tapWords(w, "o") : ""}
  </section>
  <div class="row">
    ${run.answered ? `<button class="btn" id="say">문장 듣기</button><button class="btn primary" id="next">다음</button>`
      : `<button class="btn" id="reset">다시 놓기</button><button class="btn primary" id="check" ${done ? "" : "disabled"}>확인</button>`}
  </div>`;
  bindHeader();
  if (!run.answered) bindDrag();
  if (run.answered) {
    bindTapWords(w, "o");
    $("say").onclick = () => speak(sentence(w));
    $("next").onclick = advance;
  } else {
    $("hinttoggle").onclick = () => { if (S.hint !== false) { S.hint = false; run.peek = false; save(); } else run.peek = !run.peek; render(); };
    $("reset").onclick = () => { run.pool = run.pool.concat(run.placed); run.placed = []; render(); };
    $("check").onclick = () => {
      run.tries++;
      const ok = run.placed.map(p => p.t).join(" ") === sentence(w);
      if (!ok && run.tries < 2) { run.retry = true; render(); return; }
      run.answered = true; run.correct = ok; run.retry = false;
      if (ok && run.tries === 1) recordHit(w.id);
      if (!ok) recordMiss(w.id, { word: w.w, ko: w.ko, en: sentence(w), tr: w.tr, from: "문장 배열" });
      render();
    };
  }
}

// Tiles: tap moves a tile between the line and the pool; drag drops it at an exact spot.
function bindDrag() {
  const line = document.querySelector(".line"), pool = document.querySelector(".pool");
  document.querySelectorAll(".tile").forEach(t => {
    t.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); moveTile(t.dataset.where, +t.dataset.k, t.dataset.where === "pool" ? "line" : "pool", null); } });
    t.addEventListener("pointerdown", e => {
      if (e.button > 0) return;
      const from = t.dataset.where, k = +t.dataset.k, sx = e.clientX, sy = e.clientY;
      let ghost = null, target = null;
      try { t.setPointerCapture(e.pointerId); } catch (_) { }
      const move = ev => {
        if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        if (!ghost) {
          const r = t.getBoundingClientRect();
          ghost = t.cloneNode(true); ghost.classList.add("ghost");
          Object.assign(ghost.style, { position: "fixed", left: r.left + "px", top: r.top + "px", width: r.width + "px", pointerEvents: "none", zIndex: 30, margin: 0 });
          ghost.dx = sx - r.left; ghost.dy = sy - r.top; document.body.appendChild(ghost); t.classList.add("dragging");
        }
        ghost.style.left = (ev.clientX - ghost.dx) + "px"; ghost.style.top = (ev.clientY - ghost.dy) + "px";
        target = dropTarget(ev.clientX, ev.clientY, line, pool, t);
        document.querySelectorAll(".drop-before,.drop-end").forEach(x => x.classList.remove("drop-before", "drop-end"));
        line.classList.toggle("over", !!target && target.where === "line");
        pool.classList.toggle("over", !!target && target.where === "pool");
        if (target && target.where === "line") { if (target.el) target.el.classList.add("drop-before"); else line.classList.add("drop-end"); }
      };
      const up = () => {
        t.removeEventListener("pointermove", move); t.removeEventListener("pointerup", up); t.removeEventListener("pointercancel", up);
        if (!ghost) { moveTile(from, k, from === "pool" ? "line" : "pool", null); return; }
        ghost.remove();
        if (target) moveTile(from, k, target.where, target.where === "line" ? target.index : null); else render();
      };
      t.addEventListener("pointermove", move); t.addEventListener("pointerup", up); t.addEventListener("pointercancel", up);
    });
  });
}
function dropTarget(x, y, line, pool, dragged) {
  const inBox = (el) => { const r = el.getBoundingClientRect(); return x >= r.left - 8 && x <= r.right + 8 && y >= r.top - 12 && y <= r.bottom + 12; };
  if (inBox(line)) {
    const tiles = [...line.querySelectorAll(".tile")].filter(el => el !== dragged);
    for (const el of tiles) { const r = el.getBoundingClientRect(); if (y < r.top || (y <= r.bottom && x < r.left + r.width / 2)) return { where: "line", index: +el.dataset.k, el }; }
    return { where: "line", index: run.placed.length, el: null };
  }
  if (inBox(pool)) return { where: "pool" };
  return null;
}
function moveTile(from, k, to, index) {
  const src = from === "pool" ? run.pool : run.placed;
  const item = src.splice(k, 1)[0];
  if (to === "pool") { run.pool.push(item); }
  else { let i = index == null ? run.placed.length : index; if (from === "line" && k < i) i--; run.placed.splice(i, 0, item); }
  render();
}

function renderTrans(w) {
  const en = sentence(w);
  if (!run.topts) { const others = shuffle(WORDS.filter(x => x.id !== w.id)).slice(0, 3).map(x => x.tr); run.topts = shuffle([w.tr, ...others]); }
  $app().innerHTML = `<section class="sheet">${runHeader()}</section>
  <section class="sheet">
    <div class="pos">알맞은 해석을 고르세요</div>
    <div class="prompt">${run.answered ? markColl(w) : esc(en)}</div>
    <div class="opts" style="grid-template-columns:1fr">${run.topts.map((o, i) => `<button class="btn opt ${run.answered && o === w.tr ? "right" : run.answered && o === run.pick ? "wrong" : ""}" data-i="${i}" ${run.answered ? "disabled" : ""}><span class="ab">${"ABCD"[i]}</span><span class="ot">${esc(o)}</span></button>`).join("")}</div>
    ${run.answered ? `<div class="fb ${run.pick === w.tr ? "ok" : "no"}"><b>${run.pick === w.tr ? "정답이에요" : "틀렸어요. 단어장에 담았어요"}</b>${collLine(w)}${glossBox(w, "o")}</div>${tapWords(w, "o")}` : ""}
  </section>
  <div class="row">${run.answered ? `<button class="btn" id="say">문장 듣기</button><button class="btn primary" id="next">다음</button>` : `<button class="btn" id="say">문장 듣기</button>`}</div>`;
  bindHeader();
  $("say").onclick = () => speak(en);
  document.querySelectorAll(".opt").forEach(b => b.onclick = () => {
    run.pick = run.topts[+b.dataset.i]; run.answered = true;
    if (run.pick === w.tr) recordHit(w.id); else recordMiss(w.id, { word: w.w, ko: w.ko, en, tr: w.tr, from: "해석 퀴즈" });
    render();
  });
  if (run.answered) { bindTapWords(w, "o"); $("next").onclick = advance; }
}

function renderQuiz(w) {
  if (!run.opts) run.opts = shuffle(w.opts);
  const ans = w.opts[0];
  const [a, b] = w.q.split("___");
  $app().innerHTML = `<section class="sheet">${runHeader()}</section>
  <section class="sheet">
    <div class="prompt">${esc(a)}<span class="blank">${run.answered ? esc(ans) : "&nbsp;"}</span>${esc(b)}</div>
    ${run.answered ? `<div class="muted">${esc(w.qko)}</div>` : ""}
    <div class="opts">${run.opts.map((o, i) => `<button class="btn opt ${run.answered && o === ans ? "right" : run.answered && o === run.pick ? "wrong" : ""}" data-o="${esc(o)}" ${run.answered ? "disabled" : ""}><span class="ab">${"ABCD"[i]}</span><span class="ot">${esc(o)}${run.answered ? `<span class="optko">${esc(o === ans ? w.ko : ((QOPT[w.id] || {})[o] || ""))}</span>` : ""}</span></button>`).join("")}</div>
    ${run.answered ? (run.pick === ans ? `<div class="fb ok"><b>정답이에요</b>${glossBox(w, "q")}</div>` : `<div class="fb no"><b>정답은 ${esc(ans)}. '${esc(run.pick)}'와(과) 헷갈린 기록과 함께 단어장에 담았어요</b>${glossBox(w, "q")}</div>`) : ""}
    ${run.answered ? tapWords(w, "q") : ""}
  </section>
  ${run.answered ? `<div class="row"><button class="btn primary" id="next">다음</button></div>` : ""}`;
  bindHeader();
  document.querySelectorAll(".opt").forEach(btn => btn.onclick = () => {
    run.pick = btn.dataset.o; run.answered = true;
    const full = w.q.replace("___", ans);
    if (run.pick === ans) recordHit(w.id); else recordMiss(w.id, { word: w.w, ko: w.ko, en: full, tr: w.qko, from: "빈칸 퀴즈", confused: run.pick });
    render();
  });
  if (run.answered) bindTapWords(w, "q");
  if (run.answered) $("next").onclick = () => { run.opts = null; run.pick = null; advance(); };
}

function renderDone() {
  const course = run && run.kind === "course";
  const locked = lockedCount(), fresh = freshPool().length;
  const nudge = course && !entitled() && locked && fresh < effPerDay() ? `<p class="muted" style="margin:0">무료 단어가 ${fresh}개 남았어요. <a href="#/plans">이용권</a>으로 나머지 ${locked.toLocaleString("ko-KR")}개를 열 수 있어요.</p>` : "";
  $app().innerHTML = `<section class="sheet" style="text-align:center;gap:16px;padding-block:32px">
    <div class="done-mark" aria-hidden="true"><i class="f"></i><i class="f"></i><i class="f"></i><i class="f"></i></div>
    <div style="font-size:22px;font-weight:800;font-family:var(--f-display)">${course ? "오늘 코스를 마쳤어요" : "선택 학습을 마쳤어요"}</div>
    <p class="muted" style="margin:0">틀린 단어는 나만의 단어장에 모였어요. 맞힌 단어는 1일, 3일, 7일처럼 점점 간격을 늘려서, 틀린 단어는 바로 다음 날 다시 복습해요.</p>
    ${nudge}
    ${CONFIG.freeOnly && course && CONFIG.feedbackUrl ? `<p class="muted" style="margin:0">써 보니 어땠나요? <a href="${esc(CONFIG.feedbackUrl)}" target="_blank" rel="noopener">1분 의견 남기기</a></p>` : ""}
    <div class="row"><button class="btn" id="book">단어장 보기</button><button class="btn primary" id="home">홈으로</button></div>
  </section>`;
  run = null;
  $("book").onclick = () => { view = "home"; go("#/book"); };
  $("home").onclick = () => { view = "home"; go("#/home"); };
}

// ---------- 토익 기록장 ----------
let editScore = null;
function scoreChart(list, target) {
  if (!list.length) return "";
  const W = 340, H = 210, L = 34, R = 52, T = 22, B = 28;
  const vals = list.map(x => x.total).concat(target ? [target] : []);
  let lo = Math.max(10, Math.floor((Math.min(...vals) - 60) / 100) * 100), hi = Math.min(990, Math.ceil((Math.max(...vals) + 40) / 100) * 100);
  if (hi - lo < 200) { lo = Math.max(10, hi - 200); }
  const n = list.length, X = i => n === 1 ? (L + (W - L - R) / 2) : L + i * (W - L - R) / (n - 1), Y = v => T + (hi - v) * (H - T - B) / (hi - lo);
  const ticks = []; for (let v = Math.ceil(lo / 100) * 100; v <= hi; v += 100) ticks.push(v);
  const md = d => { const [y, m, dd] = d.split("-"); return (+m) + "/" + (+dd); };
  const path = list.map((x, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(x.total).toFixed(1)).join(" ");
  const last = list[n - 1];
  return `<div class="chartbox"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="토익 점수 변화">
    ${ticks.map(v => `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--rule)" stroke-width="1"/><text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)" class="num">${v}</text>`).join("")}
    ${target ? `<line x1="${L}" x2="${W - R}" y1="${Y(target)}" y2="${Y(target)}" stroke="var(--good)" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${W - R + 6}" y="${Y(target) + 4}" font-size="11" fill="var(--muted)">목표 ${target}</text>` : ""}
    <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
    ${list.map((x, i) => `<g class="pt"><circle cx="${X(i)}" cy="${Y(x.total)}" r="14" fill="transparent"/><circle cx="${X(i)}" cy="${Y(x.total)}" r="5" fill="var(--accent)" stroke="var(--sheet)" stroke-width="2"/><title>${x.date} · ${x.total}점${x.lc != null ? ` (LC ${x.lc} / RC ${x.rc})` : ""}</title>
      <text x="${X(i)}" y="${H - 12}" text-anchor="middle" font-size="11" fill="var(--muted)">${md(x.date)}</text></g>`).join("")}
    <text x="${X(n - 1)}" y="${Y(last.total) - 12}" text-anchor="${n === 1 ? "middle" : "end"}" font-size="13" font-weight="700" fill="var(--ink)" class="num">${last.total}</text>
  </svg></div>`;
}
export function renderScores() {
  const list = (S.scores || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  const target = S.target || 0, last = list[list.length - 1], prev = list[list.length - 2];
  const best = list.length ? Math.max(...list.map(x => x.total)) : 0;
  const diff = last && prev ? last.total - prev.total : null;
  const left = last && target ? target - last.total : null;
  const sign = d => d > 0 ? "+" + d : String(d);
  $app().innerHTML = `<section class="sheet">
    <h2>나의 토익 기록장</h2>
    <div class="stats">
      <div class="stat"><b>${last ? last.total : "-"}</b><span>최근 점수</span></div>
      <div class="stat"><b style="color:${diff == null ? "var(--ink)" : diff >= 0 ? "var(--good)" : "var(--bad)"}">${diff == null ? "-" : sign(diff)}</b><span>지난번보다</span></div>
      <div class="stat"><b>${left == null ? "-" : left <= 0 ? "달성" : left}</b><span>${left != null && left <= 0 ? "목표 점수" : "목표까지 남은 점수"}</span></div>
    </div>
    <div class="row" style="align-items:flex-end">
      <label class="f">목표 점수<input type="number" id="target" min="10" max="990" step="5" inputmode="numeric" placeholder="예: 850" value="${target || ""}"></label>
      ${best && last && best !== last.total ? `<p class="muted" style="margin:0;flex:1 1 140px">최고 점수 <b class="num" style="color:var(--ink)">${best}</b>점${target && best < target ? ` · 최고 점수 기준 ${target - best}점 남음` : ""}</p>` : ""}
    </div>
    ${list.length >= 1 ? scoreChart(list, target) : `<p class="muted" style="margin:0">아래에 첫 점수를 기록하면 그래프가 그려져요.</p>`}
  </section>
  <section class="sheet">
    <h2>${editScore != null ? "점수 고치기" : "점수 기록하기"}</h2>
    <div class="row">
      <label class="f">시험일<input type="date" id="sdate" value="${editScore != null ? esc(S.scores[editScore].date) : today()}"></label>
      <label class="f">LC<input type="number" id="slc" min="5" max="495" step="5" inputmode="numeric" placeholder="5~495" value="${editScore != null && S.scores[editScore].lc != null ? S.scores[editScore].lc : ""}"></label>
      <label class="f">RC<input type="number" id="src" min="5" max="495" step="5" inputmode="numeric" placeholder="5~495" value="${editScore != null && S.scores[editScore].rc != null ? S.scores[editScore].rc : ""}"></label>
    </div>
    <p class="muted" id="sum" style="margin:0">LC와 RC를 넣으면 총점을 계산해요.</p>
    <div class="row">${editScore != null ? `<button class="btn" id="scancel">취소</button>` : ""}<button class="btn primary" id="ssave">${editScore != null ? "고친 점수 저장" : "기록하기"}</button></div>
  </section>
  ${list.length ? `<section class="sheet"><h2>시험 기록</h2>
    ${list.slice().reverse().map((x, i, arr) => {
    const before = arr[i + 1]; const d = before ? x.total - before.total : null; const idx = S.scores.indexOf(x);
    return `<div class="entry"><div class="entry-head"><b class="num">${x.total}점</b><span class="muted num">${esc(x.date)}</span></div>
      <div class="muted">${x.lc != null ? `LC ${x.lc} · RC ${x.rc}` : ""}${d != null ? ` · 지난번보다 <b style="color:${d >= 0 ? "var(--good)" : "var(--bad)"}">${sign(d)}</b>` : ""}${target ? ` · 목표까지 ${Math.max(0, target - x.total)}점` : ""}</div>
      <div class="row" style="gap:12px"><button class="link" data-edit="${idx}">고치기</button><button class="link" data-rm="${idx}">삭제</button></div></div>`;
  }).join("")}
  </section>` : ""}`;
  const lc = $("slc"), rc = $("src"), sum = $("sum");
  const valid = v => Number.isFinite(v) && v >= 5 && v <= 495 && v % 5 === 0;
  const upd = () => { const a = +lc.value, b = +rc.value; sum.textContent = lc.value && rc.value ? (valid(a) && valid(b) ? "총점 " + (a + b) + "점" : "LC와 RC는 5~495 사이, 5점 단위로 넣어 주세요.") : "LC와 RC를 넣으면 총점을 계산해요."; };
  lc.oninput = upd; rc.oninput = upd; upd();
  $("target").onchange = e => { const v = +e.target.value; S.target = v >= 10 && v <= 990 ? v : 0; save(); renderScores(); };
  $("ssave").onclick = () => {
    const a = +lc.value, b = +rc.value, date = $("sdate").value;
    if (!date || !valid(a) || !valid(b)) { toast("시험일, LC, RC를 모두 맞게 넣어 주세요"); return; }
    const rec = { date, lc: a, rc: b, total: a + b };
    S.scores = S.scores || []; if (editScore != null) S.scores[editScore] = rec; else S.scores.push(rec);
    editScore = null; save(); toast("점수를 기록했어요"); renderScores();
  };
  const cancel = $("scancel"); if (cancel) cancel.onclick = () => { editScore = null; renderScores(); };
  document.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => { editScore = +b.dataset.edit; renderScores(); window.scrollTo(0, 0); });
  document.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => {
    if (b.dataset.confirm) { S.scores.splice(+b.dataset.rm, 1); editScore = null; save(); renderScores(); }
    else { b.dataset.confirm = "1"; b.textContent = "정말 삭제할까요? 한 번 더 누르세요"; }
  });
}

export function renderBook() {
  const list = Object.values(S.book).sort((a, b) => (a.grad - b.grad) || (b.count - a.count) || (b.updated - a.updated));
  $app().innerHTML = `<section class="sheet">
    <h2>나만의 단어장 <span class="muted" style="font-weight:400">${active().length}개 복습 중</span></h2>
    <p class="muted" style="margin:0">틀린 단어가 문장과 함께 모여요. 많이 틀린 순서로 보여주고, 3번 연속 맞히면 졸업해요.</p>
    ${list.length ? "" : `<p class="muted" style="margin:0;padding-block:16px">아직 비어 있어요. 오늘 코스에서 틀리거나 "모르겠어요"를 누르면 여기에 쌓여요.</p>`}
    ${list.map(e => `<div class="entry">
      <div class="entry-head"><b>${esc(e.word)}</b><span>${e.grad ? `<span class="badge grad">졸업</span>` : `<span class="badge">${e.count}번 틀림 · 연속 ${e.streak}/3</span>`}</span></div>
      ${e.ko ? `<div class="muted">${esc(e.ko)}</div>` : ""}
      ${(e.confused || []).length ? `<div class="muted">헷갈린 단어: ${e.confused.map(esc).join(", ")}</div>` : ""}
      ${(e.sentences || []).map(s => `<div class="sent"><span>${esc(s.en)}</span>${esc(s.ko)} · ${esc(s.from)}</div>`).join("")}
      <div><button class="link" data-del="${esc(e.key)}">단어장에서 빼기</button></div>
    </div>`).join("")}
    ${active().filter(e => BY[e.key]).length ? `<button class="btn primary" id="drill">단어장으로 문장 배열 연습</button>` : ""}
  </section>`;
  document.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { delete S.book[b.dataset.del]; save(); renderBook(); });
  const d = $("drill"); if (d) d.onclick = () => { go("#/home"); startFree("order", "book"); };
}
