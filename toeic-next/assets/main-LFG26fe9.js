import{C as g,a as Qe,t as M,e as i,$ as p,b as y,s as K,c as Oe,S as Ze,f as $e,w as et,_ as bt,B as tt,d as vt}from"./ui-X-ZCmFPx.js";const st=g.storageNs+"toeic-state-v1",Pe=g.storageNs?"":"toeic-proto-v1",ee=()=>({examDate:"",perDay:20,scores:[],target:0,learned:{},book:{},course:null,srs:{},updatedAt:0});let r=ee(),N=null,Z=null,gt=[];function $t(){gt.forEach(e=>{try{e(r)}catch(t){console.error(t)}})}function nt(e){e=Object.assign(ee(),e),e.perDay>=10||(e.perDay=20),e.srs=e.srs||{},e.book=e.book||{},e.learned=e.learned||{},e.scores=e.scores||[];for(const t of Object.keys(e.learned))e.srs[t]||(e.srs[t]={box:0,due:Qe(e.learned[t],1),last:e.learned[t]});return e}function yt(e){let t;try{t=JSON.parse(e)}catch{return null}const s=m=>m!==null&&typeof m=="object"&&!Array.isArray(m),n=m=>typeof m=="string",l=m=>typeof m=="number"&&isFinite(m),o=m=>n(m)&&/^\d{4}-\d{2}-\d{2}$/.test(m);if(!s(t))return null;const c=t.learned===void 0?{}:t.learned,d=t.book===void 0?{}:t.book,u=t.srs===void 0?{}:t.srs,h=t.scores===void 0?[]:t.scores;return!s(c)||!Object.values(c).every(o)||!s(u)||!Object.values(u).every(m=>s(m)&&l(m.box)&&o(m.due)&&(m.last===void 0||o(m.last)))||!s(d)||!Object.entries(d).every(([m,$])=>s($)&&$.key===m&&n($.word)&&l($.count)&&l($.streak)&&Array.isArray($.sentences)&&$.sentences.every(w=>s(w)&&n(w.en))&&Array.isArray($.confused||[]))||!Array.isArray(h)||!h.every(m=>s(m)&&l(m.lc)&&l(m.rc))||t.examDate!==void 0&&t.examDate!==""&&!o(t.examDate)||t.perDay!==void 0&&!l(t.perDay)?null:{...t,learned:c,book:d,srs:u,scores:h,course:null}}function fe(e,{touch:t=!0}={}){r=nt(e),t&&(r.updatedAt=Date.now()),at(),$t()}function at(){try{localStorage.setItem(st,JSON.stringify(r))}catch{}}function kt(){let e=null;try{e=localStorage.getItem(st)||(Pe?localStorage.getItem(Pe):null)}catch{}if(e)try{r=nt(JSON.parse(e))}catch{r=ee()}else r=ee();return r}function wt(e){N=e}function E(){r.updatedAt=Date.now(),at(),N&&N.user&&(clearTimeout(Z),Z=setTimeout(()=>N.saveProgress(JSON.parse(JSON.stringify(r))).catch(e=>console.warn("sync failed",e)),800))}function te(){return Z&&(clearTimeout(Z),Z=null,N&&N.user)?N.saveProgress(JSON.parse(JSON.stringify(r))).catch(()=>{}):Promise.resolve()}async function Be(){if(!N||!N.user)return;const e=await N.loadProgress(),t=Object.keys(r.learned).length||r.scores.length||Object.keys(r.book).length||r.examDate;e&&e.state&&(e.state.updatedAt||0)>(r.updatedAt||0)&&!(t&&!e.state.updatedAt)?fe(e.state,{touch:!1}):(t||!e)&&await N.saveProgress(JSON.parse(JSON.stringify(r))).catch(()=>{})}const xt=()=>!Object.keys(r.learned).length&&!r.scores.length&&!Object.keys(r.book).length&&!r.examDate,_=[],R={},V={},he={},Ee={},se={},me={},_e={},Ae={},ye={};let H=[];const ke={600:"600점",750:"750점",900:"900점+"},le={600:0,750:1,900:2},Lt=["구동사","숙어","복합명사"],ze=e=>Lt.includes(e.pos),U=e=>ye[e]||"600",P=e=>e.chunks.join(" "),ot=g.storageNs+"toeic-words-v"+g.contentVersion;function St(){_.length=0;for(const e of[R,V,he,Ee,se,me,_e,Ae])for(const t of Object.keys(e))delete e[t]}function Ie(e){St();for(const t of e){const s={id:t.id,w:t.w,pos:t.pos,ko:t.ko,coll:t.coll,chunks:t.chunks,tr:t.tr,q:t.q,qko:t.qko,opts:t.opts};_.push(s),R[t.id]=s,t.hl&&(V[t.id]=t.hl,he[t.id]=t.hlko||""),t.parts&&(Ee[t.id]=t.parts),se[t.id]={o:t.go||[],q:t.gq||[]},t.qm&&(me[t.id]=t.qm),t.tg&&(_e[t.id]=t.tg),t.tv&&(Ae[t.id]=t.tv)}}function Ct(){try{const e=localStorage.getItem(ot);return e?JSON.parse(e):null}catch{return null}}function Ot(e){try{localStorage.setItem(ot,JSON.stringify(e))}catch{}}async function Et(e,t){const s=Ct();if(s&&s.catalog&&s.words){H=s.catalog;for(const n of H)ye[n.id]=n.lv;Ie(s.words.filter(n=>t||(s.tiers||{})[n.id]==="free"))}try{const[n,l]=await Promise.all([e.getCatalog(),e.getWords()]);if(n&&n.length){H=n;for(const d of H)ye[d.id]=d.lv;const o=Object.fromEntries(n.map(d=>[d.id,d.tier])),c=l.filter(d=>t||o[d.id]==="free");Ie(c),Ot({catalog:n,words:c,tiers:o,at:Date.now()})}}catch(n){if(!_.length)throw n;console.warn("content refresh failed, using cache",n)}return _.length}const F=()=>H.length-_.length,v={backend:null,user:null,ent:{active:!1},entitled:!1,returnTo:"",route:null};function T(e){location.hash===e?v.route&&v.route():location.hash=e}async function we(){const e=v.backend;try{v.ent=await e.getEntitlement()||{active:!1}}catch{v.ent={active:!1}}v.entitled=!!v.ent.active,await Et(e,v.entitled)}function B(e,t){try{v.backend&&v.backend.track(e,t)}catch{}}const J=()=>p("app"),j=()=>v.entitled,Te=()=>j()?r.perDay:Math.min(r.perDay,g.free.perDayMax),xe=()=>{const e=r.goal||"all";return j()||g.free.goals.includes(e)?e:"all"},re=()=>["600","750","900"].filter(e=>H.some(t=>t.lv===e)),_t='<svg class="lock" viewBox="0 0 16 16" width="12" height="12" aria-label="이용권 필요"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',Ke=[1,3,7,14,30,60];function de(e,t){r.srs=r.srs||{};const s=Math.max(0,Math.min(t,Ke.length-1));r.srs[e]={box:s,due:Qe(M(),Ke[s]),last:M()}}function At(e){if(!r.learned[e])return;const t=(r.srs||{})[e];if(!t)return de(e,1);t.last===M()||t.due>M()||de(e,t.box+1)}function Tt(e){r.learned[e]&&de(e,0)}const je=()=>Object.entries(r.srs||{}).filter(([e,t])=>R[e]&&r.learned[e]&&t.due<=M()).sort((e,t)=>e[1].due.localeCompare(t[1].due)||e[1].box-t[1].box).map(([e])=>e);function jt(e){const t=e.filter(c=>!ze(c)),s=e.filter(ze),n=[];let l=0,o=0;for(;l<t.length||o<s.length;){for(let c=0;c<4&&l<t.length;c++)n.push(t[l++]);o<s.length&&n.push(s[o++])}return n}function Me(){const e=xe();let t=_.filter(s=>!r.learned[s.id]);return e!=="all"&&(t=t.filter(s=>le[U(s.id)]<=le[e]),t=t.map((s,n)=>[s,n]).sort((s,n)=>le[U(s[0].id)]-le[U(n[0].id)]||s[1]-n[1]).map(s=>s[0])),jt(t)}const ce={card:"암기카드",order:"문장 배열",quiz:"빈칸 퀴즈",trans:"해석 퀴즈",mix:"섞어서",review:"간격 복습"},Je=["order","quiz","trans"],lt=()=>Je[Math.floor(Math.random()*Je.length)],ne=()=>Object.values(r.book).filter(e=>!e.grad);function oe(e,t){R[e]&&Tt(e);const s=r.book[e]||(r.book[e]={key:e,word:t.word,ko:t.ko||"",count:0,streak:0,grad:!1,sentences:[],confused:[]});s.count++,s.streak=0,s.grad=!1,s.updated=Date.now(),t.en&&!s.sentences.some(n=>n.en===t.en)&&s.sentences.unshift({en:t.en,ko:t.tr||"",from:t.from}),t.confused&&!s.confused.includes(t.confused)&&s.confused.push(t.confused),E()}function qe(e){R[e]&&At(e);const t=r.book[e];!t||t.grad||(t.streak++,t.streak>=3&&(t.grad=!0,y("'"+t.word+"' 졸업! 3번 연속 맞혔어요")),E())}let a=null,I="home";function rt(){a=null,I="home"}function Mt(){const e=ne().filter(o=>R[o.key]).sort((o,c)=>c.count-o.count).slice(0,4).map(o=>o.key),t=Me().filter(o=>!e.includes(o.id)).slice(0,Te()).map(o=>o.id),s=[...e,...t];let n=je().filter(o=>!s.includes(o)).slice(0,30);n.length<5&&(n=n.concat(K(Object.keys(r.learned).filter(o=>R[o]&&!s.includes(o)&&!n.includes(o))).slice(0,5-n.length))),n=K(n);const l=["card","order","quiz"].concat(n.length?["review"]:[]);r.course={date:M(),ids:s,fresh:t,steps:l,lists:{quiz:K(s),review:n},mk:{review:n.map(lt)},step:0,idx:0,done:!1},E()}function qt(){if((!r.course||r.course.date!==M())&&Mt(),!r.course.ids.length&&!(r.course.lists.review||[]).length){if(!j()&&F()){y("무료 단어를 모두 배웠어요. 이용권으로 나머지 단어를 열 수 있어요",2600),T("#/plans");return}y(g.freeOnly?"베타 단어를 모두 배웠어요. 선택 학습으로 복습해 보세요":"이 레벨의 새 단어를 모두 배웠어요. 목표 레벨을 올리거나 선택 학습으로 복습해 보세요",2600);return}r.course.ids.length||(r.course.steps=["review"],r.course.step=0),a={kind:"course",steps:r.course.steps||["card","order","quiz"]},B("course_start",{fresh:r.course.fresh.length}),I="run",S()}function it(e,t){if(!j()&&t.startsWith("lv")&&!g.free.goals.includes(t.slice(2))){y("이 레벨은 이용권이 있어야 열려요",2200),T("#/plans");return}let s=t==="book"?ne().filter(n=>R[n.key]).map(n=>n.key):t==="learned"?Object.keys(r.learned).filter(n=>R[n]):t==="due"?je():t.startsWith("pos:")?_.filter(n=>n.pos===t.slice(4)).map(n=>n.id):t.startsWith("lv")?_.filter(n=>U(n.id)===t.slice(2)).map(n=>n.id):_.map(n=>n.id);if(s=K(s).slice(0,10),!s.length){if(!j()&&F()&&(t.startsWith("lv")||t.startsWith("pos:")||t==="all")){y("이 범위는 이용권이 있어야 열려요",2200),T("#/plans");return}y(t==="book"?"단어장이 비어 있어요":t==="due"?"오늘 복습할 단어가 없어요":"아직 배운 단어가 없어요");return}a={kind:"free",steps:[e],ids:s,step:0,idx:0,mk:{mix:s.map(lt)}},B("free_start",{activity:e,scope:t}),I="run",S()}function De(){return a.kind==="course"?r.course:a}function ue(e){const t=a.steps[e.step];return e.lists&&e.lists[t]||e.ids}function ct(e){const t=a.steps[e.step];return t==="mix"||t==="review"?(e.mk&&e.mk[t]||[])[e.idx]||"quiz":t}function G(){const e=De();if(e.idx++,a.answered=!1,a.placed=null,a.flipped=!1,a.added={},a.peek=!1,a.opts=null,a.topts=null,a.pick=null,e.idx>=ue(e).length&&(e.idx=0,e.step++),e.step>=a.steps.length){a.kind==="course"&&(e.fresh.forEach(t=>{r.learned[t]=M(),de(t,0)}),e.done=!0,B("course_done",{fresh:e.fresh.length})),E(),I="done",S();return}a.kind==="course"&&E(),S()}function S(){if(I==="run")return Rt();if(I==="done")return Yt();Dt()}let Ye=!1;function Dt(){const e=Object.keys(r.learned).length,t=ne().length,s=je().length,n=F();let l="";if(r.examDate){const f=Math.round((new Date(r.examDate+"T00:00")-new Date(M()+"T00:00"))/864e5);l=f>0?"D-"+f:f===0?"D-DAY":"시험 종료"}const o=r.course&&r.course.date===M()?r.course:null,c=o&&o.steps||["card","order","quiz"],d=f=>{if(!o)return"";const C=c.indexOf(f);return o.done||o.step>C?"done":o.step===C?"on":""},u=o?o.done?"오늘 코스 다시 하기":o.step||o.idx?"이어서 하기":"오늘 코스 시작":"오늘 코스 시작",h=Te(),m=re().map(f=>{const C=H.filter(A=>A.lv===f),q=C.filter(A=>r.learned[A.id]).length,k=_.filter(A=>U(A.id)===f).length;return`<div class="lvrow"><span class="lvb">${ke[f]}</span><span class="bar"><i style="width:${C.length?Math.round(q/C.length*100):0}%"></i></span><span class="cnt">${q} / ${C.length}${k<C.length?" "+_t:""}</span></div>`}).join(""),$={all:"전체",600:"600점",750:"750점",900:"900점+"}[xe()],w={easy:"쉬움",normal:"보통",hard:"어려움"}[r.level||"normal"],x=Me().length,b=!j()&&n?`
  <section class="sheet upsell">
    <div class="upsell-row">
      <div><span class="eyebrow">이용권</span><b>${x?"단어 "+n.toLocaleString("ko-KR")+"개가 더 있어요":"무료 단어를 모두 배웠어요"}</b>
      <p class="muted" style="margin:0">${x?"무료 단어 "+_.length+"개로 먼저 써 보고, 마음에 들면 전체 "+H.length.toLocaleString("ko-KR")+"개를 열어요.":"이용권으로 나머지 "+n.toLocaleString("ko-KR")+"개를 열고 750점·900점+ 단어까지 이어서 배워요."}</p></div>
      <a class="btn primary" href="#/plans">이용권 보기</a>
    </div>
  </section>`:"";J().innerHTML=`
  <section class="sheet hero">
    <div class="hero-top">
      <div class="dday"><span class="eyebrow">시험까지</span><span class="big${l?"":" unset"}">${l||"D-?"}</span><span class="muted">${r.examDate?"시험일 "+i(r.examDate):"아래 학습 설정에서 시험일을 정해 주세요"}</span></div>
      <div class="seal"><b>${e}</b><span>/ ${H.length.toLocaleString("ko-KR")} 배움</span></div>
    </div>
    <div class="course">
      <div class="course-head"><h2>오늘의 코스</h2><span class="muted num">${h}개</span></div>
      <p class="muted" style="margin:0">${o?"오답 복습 "+(o.ids.length-o.fresh.length)+"개 + 새 단어 "+o.fresh.length+"개"+(o.lists&&o.lists.review&&o.lists.review.length?" + 간격 복습 "+o.lists.review.length+"문제":""):"틀린 단어 최대 4개를 먼저 복습하고, 새 단어 "+h+"개를 배워요. 마지막에는 지금까지 배운 단어로 랜덤 문제가 나와요."}</p>
      <div class="steps">${c.map(f=>`<span class="step ${d(f)}">${ce[f]}</span>`).join("")}${!o&&e?`<span class="step">간격 복습${s?" "+s:""}</span>`:""}</div>
      <button class="btn primary big" id="go">${u}</button>
    </div>
  </section>
  ${b}
  <section class="sheet">
    <span class="eyebrow">학습 현황</span>
    <div class="stats">
      <div class="stat"><b>${e}</b><span>배운 단어</span></div>
      <div class="stat${s?" hot":""}"><b>${s}</b><span>오늘 복습</span></div>
      <div class="stat${t?" hot":""}"><b>${t}</b><span>남은 오답</span></div>
      <div class="stat"><b>${Object.values(r.book).filter(f=>f.grad).length}</b><span>졸업한 단어</span></div>
    </div>
    <div class="lvbars">${m}</div>
  </section>
  <section class="sheet">
    <h2>선택 학습</h2>
    <div class="row">
      <label class="f">활동<select id="act"><option value="mix">섞어서 (모든 유형)</option><option value="order">문장 배열</option><option value="quiz">빈칸 퀴즈</option><option value="trans">해석 퀴즈</option><option value="card">암기카드</option></select></label>
      <label class="f">범위<select id="scope"><option value="book">나만의 단어장</option><option value="learned">배운 단어</option><option value="due">오늘 복습할 단어</option>${re().map(f=>`<option value="lv${f}">${ke[f]} 단어${j()||g.free.goals.includes(f)?"":" · 이용권"}</option>`).join("")}<option value="pos:구동사">구동사</option><option value="pos:숙어">숙어·관용 표현</option><option value="pos:복합명사">복합명사</option><option value="all">전체 단어</option></select></label>
    </div>
    <button class="btn" id="free">10문제 시작</button>
  </section>
  <details class="sheet settings" id="settings" ${Ye||!r.examDate?"open":""}>
    <summary>학습 설정<span class="muted">${$} · 배열 ${w}</span></summary>
    <div class="settings-body">
      <div class="row">
        <label class="f">시험일<input type="date" id="exam" value="${i(r.examDate)}"></label>
        <label class="f">하루 새 단어<select id="perday">${[10,20,30,40,50].map(f=>`<option value="${f}" ${f==h?"selected":""} ${!j()&&f>g.free.perDayMax?"disabled":""}>${f}${!j()&&f>g.free.perDayMax?" · 이용권":""}</option>`).join("")}</select></label>
      </div>
      <label class="f"${re().length<2?" hidden":""}>목표 레벨 (새 단어 순서)<select id="goal">${[["all","전체 · 기본 순서"],["600","600점 · 기초 단어만"],["750","750점 · 기초 → 중급"],["900","900점+ · 쉬운 단어부터 전부"]].filter(([f])=>f==="all"||re().includes(f)).map(([f,C])=>`<option value="${f}" ${xe()===f?"selected":""} ${!j()&&!g.free.goals.includes(f)?"disabled":""}>${C}${!j()&&!g.free.goals.includes(f)?" · 이용권":""}</option>`).join("")}</select></label>
      <label class="f">문장 배열 난이도<select id="level"><option value="easy" ${r.level==="easy"?"selected":""}>쉬움 · 표현 덩어리로 묶음</option><option value="normal" ${(r.level||"normal")==="normal"?"selected":""}>보통 · 한 단어씩</option><option value="hard" ${r.level==="hard"?"selected":""}>어려움 · 함정 블록 포함</option></select></label>
      <label class="toggle"><input type="checkbox" id="hint" ${r.hint!==!1?"checked":""}> 문장 배열에서 오늘의 단어 힌트 보여주기</label>
      ${v.user?"":`<div class="xfer">
        <span class="eyebrow">기록 백업</span>
        <p class="muted" style="margin:0">학습 기록은 이 브라우저에만 있어요. 브라우저 데이터를 지우거나 기기를 바꾸기 전에 복사해 두고, 나중에 붙여넣어 불러오세요.</p>
        <div class="row"><button class="btn" id="bk-copy">내 기록 복사</button><button class="btn" id="bk-load">붙여넣은 기록 불러오기</button></div>
        <textarea id="bk-text" rows="3" placeholder="복사한 기록을 여기에 붙여넣으세요" aria-label="백업한 학습 기록"></textarea>
      </div>`}
      ${j()?"":'<p class="muted" style="margin:0">하루 새 단어 20개 이상과 750점·900점+ 목표는 <a href="#/plans">이용권</a>이 있어야 쓸 수 있어요.</p>'}
    </div>
  </details>`,p("settings").ontoggle=f=>{Ye=f.target.open},p("exam").onchange=f=>{r.examDate=f.target.value,E(),S()},p("level").onchange=f=>{r.level=f.target.value,E()},p("goal").onchange=f=>{r.goal=f.target.value,r.course&&r.course.date===M()&&!r.course.step&&!r.course.idx&&(r.course=null),E(),S()},p("hint").onchange=f=>{r.hint=f.target.checked,E()},p("perday").onchange=f=>{r.perDay=+f.target.value,r.course&&r.course.date===M()&&!r.course.step&&!r.course.idx&&(r.course=null),E(),S()},p("go").onclick=()=>{o&&o.done&&(r.course=null),qt()},p("free").onclick=()=>it(p("act").value,p("scope").value),p("bk-copy")&&Nt()}function Nt(){const e=p("bk-text");p("bk-copy").onclick=async()=>{const t=JSON.stringify(r);e.value=t;try{await navigator.clipboard.writeText(t),y("기록을 복사했어요. 메모 앱 등에 붙여넣어 보관하세요",2400)}catch{e.focus(),e.select(),y("아래 글자를 모두 선택해서 복사해 주세요",2400)}},p("bk-load").onclick=()=>{const t=yt(e.value.trim());if(!t){y("기록 형식이 맞지 않아요. 복사한 글자를 빠짐없이 붙여넣어 주세요",2600);return}const s=Object.keys(t.learned||{}).length;confirm(`배운 단어 ${s}개가 담긴 기록으로 바꿀까요? 지금 이 기기의 기록은 사라져요.`)&&(fe(t),e.value="",y("기록을 불러왔어요",2e3),S())}}function be(){const e=De(),t=a.steps[e.step],s=ct(e),n=ue(e).length,l=a.steps.map((d,u)=>{const h=e.step;e.step=u;const m=ue(e).length;return e.step=h,m}),o=l.reduce((d,u)=>d+u,0),c=l.slice(0,e.step).reduce((d,u)=>d+u,0)+e.idx;return`<div class="runhead">
    <div class="steps">${a.steps.map((d,u)=>`<span class="step ${u<e.step?"done":u===e.step?"on":""}">${ce[d]}</span>`).join("")}</div>
    <button class="link" id="quit">그만하기</button></div>
    <div class="progress"><i style="width:${Math.round(c/o*100)}%"></i></div>
    <p class="muted num" style="margin:0">${t!==s?ce[t]+" · ":""}${ce[s]} ${e.idx+1} / ${n}</p>`}function ve(){p("quit").onclick=()=>{a=null,I="home",S(),window.scrollTo(0,0)}}function ae(e,t){const s=(se[e.id]||{})[t]||[];return s.length?`<div class="gloss"><span class="gl-t">문장 속 다른 단어</span>${s.map(([n,l])=>`<span><b>${i(n)}</b> : ${i(l)}</span>`).join("")}</div>`:""}function Le(e){const t=V[e.id];if(!t)return"";const s=Ee[e.id]||[];return`<span class="en"><mark class="coll" style="font-weight:600">${i(t)}</mark> : ${i(he[e.id]||"")}</span>`+(s.length?`<span class="parts">${s.map(([n,l])=>`<span><b>${i(n)}</b> : ${i(l)}</span>`).join("")}</span>`:"")}function Se(e){const t=P(e),s=V[e.id]||"",n=s?t.toLowerCase().indexOf(s.toLowerCase()):-1;return n<0?i(t):i(t.slice(0,n))+`<mark class="coll">${i(t.slice(n,n+s.length))}</mark>`+i(t.slice(n+s.length))}const Ht={"in-charge-of":{text:"in charge of",ko:"~을 담당하는"},"carry-out":{text:"carry out",ko:"수행하다, 실시하다"},"short-notice":{text:"short notice",ko:"촉박한 통보 (on such short notice: 그렇게 촉박하게)"}};function dt(e,t){return t==="q"?{en:e.q.replace("___",e.opts[0]),tr:e.qko,key:Ht[e.id]||{text:e.opts[0],ko:e.ko},gl:(se[e.id]||{}).q||[]}:{en:P(e),tr:e.tr,key:V[e.id]?{text:V[e.id],ko:he[e.id]||""}:null,gl:(se[e.id]||{}).o||[]}}function ut(e,t){const s=dt(e,t),n=s.en.split(" "),l=h=>h.toLowerCase().replace(/[^a-z0-9'.\-é]/g,"").replace(/\.$/,""),o=[];s.key&&o.push({...s.key,key:!0}),s.gl.forEach(([h,m])=>{const $=h.replace(/\s*~(ing)?$/,"").replace(/^~\s*/,"").trim();$&&o.push({text:$,ko:m.replace(/\s*\(.*\)$/,"")})}),o.sort((h,m)=>m.text.split(" ").length-h.text.split(" ").length);const c=new Array(n.length).fill(null);o.forEach(h=>{const m=h.text.split(" ").map(l);for(let $=0;$+m.length<=n.length;$++)if(m.every((w,x)=>l(n[$+x])===w&&c[$+x]===null)){for(let w=0;w<m.length;w++)c[$+w]=h;break}});const d=[];let u=0;for(;u<n.length;){const h=c[u];if(h){let m=u;for(;m<n.length&&c[m]===h;)m++;d.push({show:n.slice(u,m).join(" "),word:h.text,ko:h.ko,key:!!h.key}),u=m}else d.push({show:n[u],word:n[u].replace(/[^A-Za-z'\-é]/g,""),ko:"",key:!1}),u++}return t==="q"&&(a&&a.opts||e.opts).forEach(h=>h===e.opts[0]?d.push({show:h,word:h,ko:e.ko,opt:!0,key:!0}):d.push({show:h,word:h,ko:(me[e.id]||{})[h]||"",opt:!0})),d}function Ne(e,t){const s=ut(e,t),n=(c,d)=>c.word?`<button class="w ${c.word.includes(" ")?"chunk":""} ${a.added&&a.added[d]?"added":""}" data-i="${d}">${i(c.show)}</button>`:`<span>${i(c.show)}</span>`,l=s.map((c,d)=>[c,d]).filter(([c])=>!c.opt),o=s.map((c,d)=>[c,d]).filter(([c])=>c.opt);return`<div class="muted" style="font-size:13px">모르는 단어나 표현이 있었다면 눌러서 단어장에 담으세요. 다시 누르면 취소돼요</div>
  <div class="words">${l.map(([c,d])=>n(c,d)).join("")}</div>
  ${o.length?`<div class="muted" style="font-size:13px">선택지 중 모르는 단어 <span style="font-size:12px">(맞혔어도 확실하지 않으면 정답 단어도 담으세요)</span></div><div class="words">${o.map(([c,d])=>n(c,d)).join("")}</div>`:""}`}function He(e,t){const s=ut(e,t),n=dt(e,t);document.querySelectorAll(".w").forEach(l=>l.onclick=()=>{const o=s[+l.dataset.i];a.added=a.added||{};const c=o.word.toLowerCase()===e.w.toLowerCase()||t==="q"&&o.key,d=c?e.w:o.word,u=c?e.id:"c:"+d.toLowerCase(),h=a.added[l.dataset.i];if(h){h.before?r.book[u]=h.before:delete r.book[u],delete a.added[l.dataset.i],l.classList.remove("added"),E(),y("'"+d+"' 담기를 취소했어요");return}a.added[l.dataset.i]={before:r.book[u]?JSON.parse(JSON.stringify(r.book[u])):null},l.classList.add("added"),oe(u,{word:d,ko:c?e.ko:o.ko,en:n.en,tr:n.tr,from:o.opt?"선택지에서 담음":"직접 담음"}),r.book[u]&&!r.book[u].ko&&o.ko&&(r.book[u].ko=o.ko,E()),y("'"+d+"'을(를) 문장과 함께 담았어요")})}function Rt(){const e=De(),t=ct(e),s=R[ue(e)[e.idx]];if(!s){G();return}if(t==="trans")return Kt(s);if(t==="card")return Pt(s);if(t==="order")return Bt(s);Jt(s)}function Pt(e){const t=a.flipped;J().innerHTML=`<section class="sheet">${be()}</section>
  <section class="sheet card" id="card" role="button" tabindex="0" aria-label="카드 뒤집기">
    <div class="word">${i(e.w)}</div><div class="pos">${i(e.pos)} · <span class="lvb">${ke[U(e.id)]}</span></div>
    ${t?`<div class="meaning">${i(e.ko)}</div>
      <div><span class="coll">${i(e.coll)}</span></div>
      <div class="sent" style="text-align:left">${i(P(e))}<span>${i(e.tr)}</span></div>`:'<div class="tapnote">뜻을 떠올린 뒤 눌러서 확인</div>'}
  </section>
  <div class="row"><button class="btn" id="say">발음 듣기</button></div>
  ${t?'<div class="row"><button class="btn" id="no">모르겠어요</button><button class="btn primary" id="yes">알아요</button></div>':""}`,ve();const s=()=>{a.flipped||(a.flipped=!0,S())},n=p("card");n.onclick=s,n.onkeydown=l=>{(l.key==="Enter"||l.key===" ")&&(l.preventDefault(),s())},p("say").onclick=()=>Oe(e.w),t&&(p("yes").onclick=G,p("no").onclick=()=>{oe(e.id,{word:e.w,ko:e.ko,en:P(e),tr:e.tr,from:"암기카드"}),y("나만의 단어장에 담았어요"),G()})}function Ce(e){return a&&a.ts==="v"?Ae[e.id]:_e[e.id]}function We(e){const t=Ce(e);if(!t)return"";const s=a.ts==="v";return`<div class="gloss"><span class="gl-t">파트5 ${s?"어휘":"문법"} 함정 풀이</span><span><b>${i(t.a)}</b> : 정답</span>${t.t.map(([n,l])=>`<span><s>${i(n)}</s> : ${i(l)}</span>`).join("")}${s?'<span class="muted">모두 문법적으로는 들어갈 수 있어서, 뜻을 알아야 고를 수 있어요</span>':""}</div>`}function Bt(e){const t=r.level||"normal";if(!a.placed){const c=t==="easy"?e.chunks:P(e).split(" ");a.ts=Math.random()<.5?"v":"g";const d=t==="hard"?((Ce(e)||{}).t||[]).map(u=>u[0]):[];a.pool=K(c.map(u=>({t:u})).concat(d.map(u=>({t:u,trap:!0})))),a.pool.map(u=>u.t).join(" ")===P(e)&&a.pool.reverse(),a.placed=[],a.tries=0,a.retry=!1,a.lv=t}const s=a.lv==="hard",n=s?a.placed.length>0:a.pool.length===0,l=(c,d,u)=>`<button class="tile" data-where="${d}" data-k="${u}" ${a.answered?"disabled":""}>${i(c.t)}</button>`;let o="";a.answered?o=a.correct?`<div class="fb ok"><b>${a.tries>1?"두 번째에 맞혔어요":"정답이에요"}</b><span class="en">${Se(e)}</span>${Le(e)}${ae(e,"o")}${s?We(e):""}</div>`:`<div class="fb no"><b>두 번 모두 틀렸어요. 원래 문장을 보고 단어장에 담았어요</b><span class="en">${Se(e)}</span>${Le(e)}${ae(e,"o")}${s?We(e):""}</div>`:a.retry&&(o='<div class="fb no"><b>순서가 달라요. 한 번 더 해보세요</b><span class="muted">블록을 눌러서 옮기면 고칠 수 있어요</span></div>'),J().innerHTML=`<section class="sheet">${be()}</section>
  <section class="sheet">
    <div class="hintrow">${r.hint!==!1||a.peek||a.answered?`<div class="pos">오늘의 단어 <b style="color:var(--ink)">${i(e.w)}</b> · ${i(e.ko)}</div>`:'<div class="pos">힌트 꺼짐</div>'}${a.answered?"":`<button class="link" id="hinttoggle">${r.hint!==!1?"힌트 끄기":a.peek?"다시 가리기":"힌트 보기"}</button>`}</div>
    <div class="prompt">${i(e.tr)}</div>
    ${s&&!a.answered?`<div class="muted" style="font-size:13px">파트5처럼 ${a.ts==="v"?"뜻을 알아야 고를 수 있는":"형태가 비슷한"} 단어 ${((Ce(e)||{}).t||[]).length}개가 함정으로 섞여 있어요. 블록을 다 쓰지 않아도 돼요</div>`:""}
    <div class="line" aria-label="내가 만든 문장">${a.placed.map((c,d)=>l(c,"line",d)).join("")}</div>
    <div class="pool" aria-label="단어 블록">${a.pool.map((c,d)=>l(c,"pool",d)).join("")}</div>
    ${o}
    ${a.answered?Ne(e,"o"):""}
  </section>
  <div class="row">
    ${a.answered?'<button class="btn" id="say">문장 듣기</button><button class="btn primary" id="next">다음</button>':`<button class="btn" id="reset">다시 놓기</button><button class="btn primary" id="check" ${n?"":"disabled"}>확인</button>`}
  </div>`,ve(),a.answered||zt(),a.answered?(He(e,"o"),p("say").onclick=()=>Oe(P(e)),p("next").onclick=G):(p("hinttoggle").onclick=()=>{r.hint!==!1?(r.hint=!1,a.peek=!1,E()):a.peek=!a.peek,S()},p("reset").onclick=()=>{a.pool=a.pool.concat(a.placed),a.placed=[],S()},p("check").onclick=()=>{a.tries++;const c=a.placed.map(d=>d.t).join(" ")===P(e);if(!c&&a.tries<2){a.retry=!0,S();return}a.answered=!0,a.correct=c,a.retry=!1,c&&a.tries===1&&qe(e.id),c||oe(e.id,{word:e.w,ko:e.ko,en:P(e),tr:e.tr,from:"문장 배열"}),S()})}function zt(){const e=document.querySelector(".line"),t=document.querySelector(".pool");document.querySelectorAll(".tile").forEach(s=>{s.addEventListener("keydown",n=>{(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),ge(s.dataset.where,+s.dataset.k,s.dataset.where==="pool"?"line":"pool",null))}),s.addEventListener("pointerdown",n=>{if(n.button>0)return;const l=s.dataset.where,o=+s.dataset.k,c=n.clientX,d=n.clientY;let u=null,h=null;try{s.setPointerCapture(n.pointerId)}catch{}const m=w=>{if(!(!u&&Math.hypot(w.clientX-c,w.clientY-d)<6)){if(!u){const x=s.getBoundingClientRect();u=s.cloneNode(!0),u.classList.add("ghost"),Object.assign(u.style,{position:"fixed",left:x.left+"px",top:x.top+"px",width:x.width+"px",pointerEvents:"none",zIndex:30,margin:0}),u.dx=c-x.left,u.dy=d-x.top,document.body.appendChild(u),s.classList.add("dragging")}u.style.left=w.clientX-u.dx+"px",u.style.top=w.clientY-u.dy+"px",h=It(w.clientX,w.clientY,e,t,s),document.querySelectorAll(".drop-before,.drop-end").forEach(x=>x.classList.remove("drop-before","drop-end")),e.classList.toggle("over",!!h&&h.where==="line"),t.classList.toggle("over",!!h&&h.where==="pool"),h&&h.where==="line"&&(h.el?h.el.classList.add("drop-before"):e.classList.add("drop-end"))}},$=()=>{if(s.removeEventListener("pointermove",m),s.removeEventListener("pointerup",$),s.removeEventListener("pointercancel",$),!u){ge(l,o,l==="pool"?"line":"pool",null);return}u.remove(),h?ge(l,o,h.where,h.where==="line"?h.index:null):S()};s.addEventListener("pointermove",m),s.addEventListener("pointerup",$),s.addEventListener("pointercancel",$)})})}function It(e,t,s,n,l){const o=c=>{const d=c.getBoundingClientRect();return e>=d.left-8&&e<=d.right+8&&t>=d.top-12&&t<=d.bottom+12};if(o(s)){const c=[...s.querySelectorAll(".tile")].filter(d=>d!==l);for(const d of c){const u=d.getBoundingClientRect();if(t<u.top||t<=u.bottom&&e<u.left+u.width/2)return{where:"line",index:+d.dataset.k,el:d}}return{where:"line",index:a.placed.length,el:null}}return o(n)?{where:"pool"}:null}function ge(e,t,s,n){const o=(e==="pool"?a.pool:a.placed).splice(t,1)[0];if(s==="pool")a.pool.push(o);else{let c=n==null?a.placed.length:n;e==="line"&&t<c&&c--,a.placed.splice(c,0,o)}S()}function Kt(e){const t=P(e);if(!a.topts){const s=K(_.filter(n=>n.id!==e.id)).slice(0,3).map(n=>n.tr);a.topts=K([e.tr,...s])}J().innerHTML=`<section class="sheet">${be()}</section>
  <section class="sheet">
    <div class="pos">알맞은 해석을 고르세요</div>
    <div class="prompt">${a.answered?Se(e):i(t)}</div>
    <div class="opts" style="grid-template-columns:1fr">${a.topts.map((s,n)=>`<button class="btn opt ${a.answered&&s===e.tr?"right":a.answered&&s===a.pick?"wrong":""}" data-i="${n}" ${a.answered?"disabled":""}><span class="ab">${"ABCD"[n]}</span><span class="ot">${i(s)}</span></button>`).join("")}</div>
    ${a.answered?`<div class="fb ${a.pick===e.tr?"ok":"no"}"><b>${a.pick===e.tr?"정답이에요":"틀렸어요. 단어장에 담았어요"}</b>${Le(e)}${ae(e,"o")}</div>${Ne(e,"o")}`:""}
  </section>
  <div class="row">${a.answered?'<button class="btn" id="say">문장 듣기</button><button class="btn primary" id="next">다음</button>':'<button class="btn" id="say">문장 듣기</button>'}</div>`,ve(),p("say").onclick=()=>Oe(t),document.querySelectorAll(".opt").forEach(s=>s.onclick=()=>{a.pick=a.topts[+s.dataset.i],a.answered=!0,a.pick===e.tr?qe(e.id):oe(e.id,{word:e.w,ko:e.ko,en:t,tr:e.tr,from:"해석 퀴즈"}),S()}),a.answered&&(He(e,"o"),p("next").onclick=G)}function Jt(e){a.opts||(a.opts=K(e.opts));const t=e.opts[0],[s,n]=e.q.split("___");J().innerHTML=`<section class="sheet">${be()}</section>
  <section class="sheet">
    <div class="prompt">${i(s)}<span class="blank">${a.answered?i(t):"&nbsp;"}</span>${i(n)}</div>
    ${a.answered?`<div class="muted">${i(e.qko)}</div>`:""}
    <div class="opts">${a.opts.map((l,o)=>`<button class="btn opt ${a.answered&&l===t?"right":a.answered&&l===a.pick?"wrong":""}" data-o="${i(l)}" ${a.answered?"disabled":""}><span class="ab">${"ABCD"[o]}</span><span class="ot">${i(l)}${a.answered?`<span class="optko">${i(l===t?e.ko:(me[e.id]||{})[l]||"")}</span>`:""}</span></button>`).join("")}</div>
    ${a.answered?a.pick===t?`<div class="fb ok"><b>정답이에요</b>${ae(e,"q")}</div>`:`<div class="fb no"><b>정답은 ${i(t)}. '${i(a.pick)}'와(과) 헷갈린 기록과 함께 단어장에 담았어요</b>${ae(e,"q")}</div>`:""}
    ${a.answered?Ne(e,"q"):""}
  </section>
  ${a.answered?'<div class="row"><button class="btn primary" id="next">다음</button></div>':""}`,ve(),document.querySelectorAll(".opt").forEach(l=>l.onclick=()=>{a.pick=l.dataset.o,a.answered=!0;const o=e.q.replace("___",t);a.pick===t?qe(e.id):oe(e.id,{word:e.w,ko:e.ko,en:o,tr:e.qko,from:"빈칸 퀴즈",confused:a.pick}),S()}),a.answered&&He(e,"q"),a.answered&&(p("next").onclick=()=>{a.opts=null,a.pick=null,G()})}function Yt(){const e=a&&a.kind==="course",t=F(),s=Me().length,n=e&&!j()&&t&&s<Te()?`<p class="muted" style="margin:0">무료 단어가 ${s}개 남았어요. <a href="#/plans">이용권</a>으로 나머지 ${t.toLocaleString("ko-KR")}개를 열 수 있어요.</p>`:"";J().innerHTML=`<section class="sheet" style="text-align:center;gap:16px;padding-block:32px">
    <div class="done-mark" aria-hidden="true"><i class="f"></i><i class="f"></i><i class="f"></i><i class="f"></i></div>
    <div style="font-size:22px;font-weight:800;font-family:var(--f-display)">${e?"오늘 코스를 마쳤어요":"선택 학습을 마쳤어요"}</div>
    <p class="muted" style="margin:0">틀린 단어는 나만의 단어장에 모였어요. 맞힌 단어는 1일, 3일, 7일처럼 점점 간격을 늘려서, 틀린 단어는 바로 다음 날 다시 복습해요.</p>
    ${n}
    ${g.freeOnly&&e&&g.feedbackUrl?`<p class="muted" style="margin:0">써 보니 어땠나요? <a href="${i(g.feedbackUrl)}" target="_blank" rel="noopener">1분 의견 남기기</a></p>`:""}
    <div class="row"><button class="btn" id="book">단어장 보기</button><button class="btn primary" id="home">홈으로</button></div>
  </section>`,a=null,p("book").onclick=()=>{I="home",T("#/book")},p("home").onclick=()=>{I="home",T("#/home")}}let O=null;function Wt(e,t){if(!e.length)return"";const s=340,n=210,l=34,o=52,c=22,d=28,u=e.map(k=>k.total).concat(t?[t]:[]);let h=Math.max(10,Math.floor((Math.min(...u)-60)/100)*100),m=Math.min(990,Math.ceil((Math.max(...u)+40)/100)*100);m-h<200&&(h=Math.max(10,m-200));const $=e.length,w=k=>$===1?l+(s-l-o)/2:l+k*(s-l-o)/($-1),x=k=>c+(m-k)*(n-c-d)/(m-h),b=[];for(let k=Math.ceil(h/100)*100;k<=m;k+=100)b.push(k);const f=k=>{const[A,ht,mt]=k.split("-");return+ht+"/"+ +mt},C=e.map((k,A)=>(A?"L":"M")+w(A).toFixed(1)+" "+x(k.total).toFixed(1)).join(" "),q=e[$-1];return`<div class="chartbox"><svg viewBox="0 0 ${s} ${n}" role="img" aria-label="토익 점수 변화">
    ${b.map(k=>`<line x1="${l}" x2="${s-o}" y1="${x(k)}" y2="${x(k)}" stroke="var(--rule)" stroke-width="1"/><text x="${l-8}" y="${x(k)+4}" text-anchor="end" font-size="11" fill="var(--muted)" class="num">${k}</text>`).join("")}
    ${t?`<line x1="${l}" x2="${s-o}" y1="${x(t)}" y2="${x(t)}" stroke="var(--good)" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${s-o+6}" y="${x(t)+4}" font-size="11" fill="var(--muted)">목표 ${t}</text>`:""}
    <path d="${C}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
    ${e.map((k,A)=>`<g class="pt"><circle cx="${w(A)}" cy="${x(k.total)}" r="14" fill="transparent"/><circle cx="${w(A)}" cy="${x(k.total)}" r="5" fill="var(--accent)" stroke="var(--sheet)" stroke-width="2"/><title>${k.date} · ${k.total}점${k.lc!=null?` (LC ${k.lc} / RC ${k.rc})`:""}</title>
      <text x="${w(A)}" y="${n-12}" text-anchor="middle" font-size="11" fill="var(--muted)">${f(k.date)}</text></g>`).join("")}
    <text x="${w($-1)}" y="${x(q.total)-12}" text-anchor="${$===1?"middle":"end"}" font-size="13" font-weight="700" fill="var(--ink)" class="num">${q.total}</text>
  </svg></div>`}function Y(){const e=(r.scores||[]).slice().sort((b,f)=>b.date.localeCompare(f.date)),t=r.target||0,s=e[e.length-1],n=e[e.length-2],l=e.length?Math.max(...e.map(b=>b.total)):0,o=s&&n?s.total-n.total:null,c=s&&t?t-s.total:null,d=b=>b>0?"+"+b:String(b);J().innerHTML=`<section class="sheet">
    <h2>나의 토익 기록장</h2>
    <div class="stats">
      <div class="stat"><b>${s?s.total:"-"}</b><span>최근 점수</span></div>
      <div class="stat"><b style="color:${o==null?"var(--ink)":o>=0?"var(--good)":"var(--bad)"}">${o==null?"-":d(o)}</b><span>지난번보다</span></div>
      <div class="stat"><b>${c==null?"-":c<=0?"달성":c}</b><span>${c!=null&&c<=0?"목표 점수":"목표까지 남은 점수"}</span></div>
    </div>
    <div class="row" style="align-items:flex-end">
      <label class="f">목표 점수<input type="number" id="target" min="10" max="990" step="5" inputmode="numeric" placeholder="예: 850" value="${t||""}"></label>
      ${l&&s&&l!==s.total?`<p class="muted" style="margin:0;flex:1 1 140px">최고 점수 <b class="num" style="color:var(--ink)">${l}</b>점${t&&l<t?` · 최고 점수 기준 ${t-l}점 남음`:""}</p>`:""}
    </div>
    ${e.length>=1?Wt(e,t):'<p class="muted" style="margin:0">아래에 첫 점수를 기록하면 그래프가 그려져요.</p>'}
  </section>
  <section class="sheet">
    <h2>${O!=null?"점수 고치기":"점수 기록하기"}</h2>
    <div class="row">
      <label class="f">시험일<input type="date" id="sdate" value="${O!=null?i(r.scores[O].date):M()}"></label>
      <label class="f">LC<input type="number" id="slc" min="5" max="495" step="5" inputmode="numeric" placeholder="5~495" value="${O!=null&&r.scores[O].lc!=null?r.scores[O].lc:""}"></label>
      <label class="f">RC<input type="number" id="src" min="5" max="495" step="5" inputmode="numeric" placeholder="5~495" value="${O!=null&&r.scores[O].rc!=null?r.scores[O].rc:""}"></label>
    </div>
    <p class="muted" id="sum" style="margin:0">LC와 RC를 넣으면 총점을 계산해요.</p>
    <div class="row">${O!=null?'<button class="btn" id="scancel">취소</button>':""}<button class="btn primary" id="ssave">${O!=null?"고친 점수 저장":"기록하기"}</button></div>
  </section>
  ${e.length?`<section class="sheet"><h2>시험 기록</h2>
    ${e.slice().reverse().map((b,f,C)=>{const q=C[f+1],k=q?b.total-q.total:null,A=r.scores.indexOf(b);return`<div class="entry"><div class="entry-head"><b class="num">${b.total}점</b><span class="muted num">${i(b.date)}</span></div>
      <div class="muted">${b.lc!=null?`LC ${b.lc} · RC ${b.rc}`:""}${k!=null?` · 지난번보다 <b style="color:${k>=0?"var(--good)":"var(--bad)"}">${d(k)}</b>`:""}${t?` · 목표까지 ${Math.max(0,t-b.total)}점`:""}</div>
      <div class="row" style="gap:12px"><button class="link" data-edit="${A}">고치기</button><button class="link" data-rm="${A}">삭제</button></div></div>`}).join("")}
  </section>`:""}`;const u=p("slc"),h=p("src"),m=p("sum"),$=b=>Number.isFinite(b)&&b>=5&&b<=495&&b%5===0,w=()=>{const b=+u.value,f=+h.value;m.textContent=u.value&&h.value?$(b)&&$(f)?"총점 "+(b+f)+"점":"LC와 RC는 5~495 사이, 5점 단위로 넣어 주세요.":"LC와 RC를 넣으면 총점을 계산해요."};u.oninput=w,h.oninput=w,w(),p("target").onchange=b=>{const f=+b.target.value;r.target=f>=10&&f<=990?f:0,E(),Y()},p("ssave").onclick=()=>{const b=+u.value,f=+h.value,C=p("sdate").value;if(!C||!$(b)||!$(f)){y("시험일, LC, RC를 모두 맞게 넣어 주세요");return}const q={date:C,lc:b,rc:f,total:b+f};r.scores=r.scores||[],O!=null?r.scores[O]=q:r.scores.push(q),O=null,E(),y("점수를 기록했어요"),Y()};const x=p("scancel");x&&(x.onclick=()=>{O=null,Y()}),document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{O=+b.dataset.edit,Y(),window.scrollTo(0,0)}),document.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{b.dataset.confirm?(r.scores.splice(+b.dataset.rm,1),O=null,E(),Y()):(b.dataset.confirm="1",b.textContent="정말 삭제할까요? 한 번 더 누르세요")})}function pt(){const e=Object.values(r.book).sort((s,n)=>s.grad-n.grad||n.count-s.count||n.updated-s.updated);J().innerHTML=`<section class="sheet">
    <h2>나만의 단어장 <span class="muted" style="font-weight:400">${ne().length}개 복습 중</span></h2>
    <p class="muted" style="margin:0">틀린 단어가 문장과 함께 모여요. 많이 틀린 순서로 보여주고, 3번 연속 맞히면 졸업해요.</p>
    ${e.length?"":'<p class="muted" style="margin:0;padding-block:16px">아직 비어 있어요. 오늘 코스에서 틀리거나 "모르겠어요"를 누르면 여기에 쌓여요.</p>'}
    ${e.map(s=>`<div class="entry">
      <div class="entry-head"><b>${i(s.word)}</b><span>${s.grad?'<span class="badge grad">졸업</span>':`<span class="badge">${s.count}번 틀림 · 연속 ${s.streak}/3</span>`}</span></div>
      ${s.ko?`<div class="muted">${i(s.ko)}</div>`:""}
      ${(s.confused||[]).length?`<div class="muted">헷갈린 단어: ${s.confused.map(i).join(", ")}</div>`:""}
      ${(s.sentences||[]).map(n=>`<div class="sent"><span>${i(n.en)}</span>${i(n.ko)} · ${i(n.from)}</div>`).join("")}
      <div><button class="link" data-del="${i(s.key)}">단어장에서 빼기</button></div>
    </div>`).join("")}
    ${ne().filter(s=>R[s.key]).length?'<button class="btn primary" id="drill">단어장으로 문장 배열 연습</button>':""}
  </section>`,document.querySelectorAll("[data-del]").forEach(s=>s.onclick=()=>{delete r.book[s.dataset.del],E(),pt()});const t=p("drill");t&&(t.onclick=()=>{T("#/home"),it("order","book")})}const D=g.business,Ut=g.appName,X=g.supportEmail;function Vt(){return`<h1>이용약관</h1>
<p class="muted">시행일: 2026년 __월 __일</p>
<h3>제1조 (목적)</h3><p>이 약관은 ${i(D.name)}(이하 "회사")가 제공하는 ${i(Ut)} 서비스(이하 "서비스")의 이용 조건과 절차, 회사와 이용자의 권리·의무를 정합니다.</p>
<h3>제2조 (정의)</h3><p>"서비스"는 토익 단어·예문 학습 콘텐츠와 학습 기록 기능을 말합니다. "이용권"은 정해진 기간 동안 유료 콘텐츠를 이용할 수 있는 권리입니다. "이용자"는 이 약관에 따라 서비스를 이용하는 회원과 비회원입니다.</p>
<h3>제3조 (약관의 효력과 변경)</h3><p>회사는 약관을 서비스 화면에 게시합니다. 약관을 바꿀 때는 적용일 7일 전(이용자에게 불리한 변경은 30일 전)부터 공지합니다. 변경에 동의하지 않는 이용자는 서비스 이용을 중단하고 탈퇴할 수 있습니다.</p>
<h3>제4조 (회원 가입과 계정)</h3><p>이메일 인증 또는 소셜 로그인으로 가입합니다. 계정은 본인만 사용해야 하며, 계정 관리 소홀로 생긴 문제는 이용자가 책임집니다. 만 14세 미만은 법정대리인의 동의가 있어야 가입할 수 있습니다.</p>
<h3>제5조 (서비스 제공과 변경)</h3><p>회사는 무료 콘텐츠와 유료 이용권을 제공합니다. 서비스 내용은 개선을 위해 바뀔 수 있으며, 중요한 변경은 미리 공지합니다. 점검, 장애, 천재지변 등으로 서비스가 일시 중단될 수 있습니다.</p>
<h3>제6조 (이용권과 결제)</h3><p>이용권은 결제가 승인된 때부터 표시된 기간 동안 유효합니다. 유효한 이용권이 있는 상태에서 추가로 결제하면 기존 이용권이 끝나는 날부터 이어집니다. 가격은 결제 화면에 표시된 금액(부가세 포함)이며, 결제는 ${i(D.name)}이(가) 계약한 전자결제대행사(토스페이먼츠)를 통해 처리됩니다.</p>
<h3>제7조 (청약철회와 환불)</h3><p>이용자는 결제일로부터 7일 이내, 유료 콘텐츠 학습을 시작하지 않았다면 전액 환불받을 수 있습니다. 유료 콘텐츠 학습을 시작한 뒤에는 전자상거래법 제17조 제2항에 따라 청약철회가 제한되며, 이 경우 회사는 남은 기간에 해당하는 금액을 일할 계산해 환불합니다. 환불 요청은 ${i(X)}로 보내 주시면 영업일 기준 3일 이내에 처리합니다. 자세한 내용은 환불규정을 따릅니다.</p>
<h3>제8조 (이용자의 의무)</h3><p>이용자는 콘텐츠를 복제·배포·판매하거나 자동화 수단으로 수집해서는 안 되며, 서비스 운영을 방해하는 행위를 해서는 안 됩니다. 위반 시 회사는 이용을 제한하거나 계약을 해지할 수 있습니다.</p>
<h3>제9조 (지식재산권)</h3><p>서비스의 예문, 해설, 문제, 디자인 등 콘텐츠의 저작권은 회사에 있습니다. 단어 목록은 TOEIC Service List(Browne &amp; Culligan, CC BY-SA 4.0)를 바탕으로 하며 해당 라이선스 조건을 따릅니다. 이용자는 개인 학습 목적으로만 콘텐츠를 이용할 수 있습니다.</p>
<h3>제10조 (계약 해지와 탈퇴)</h3><p>이용자는 언제든 설정 화면에서 탈퇴할 수 있습니다. 탈퇴하면 학습 기록은 삭제되고, 결제 기록은 관련 법령에 따라 보관 기간 동안만 보관됩니다. 남은 이용권은 제7조에 따라 환불합니다.</p>
<h3>제11조 (책임의 한계)</h3><p>회사는 서비스가 특정 시험 점수를 보장한다고 약속하지 않습니다. 회사의 고의 또는 중대한 과실이 없는 한, 무료 서비스 이용과 관련한 손해에 대해서는 책임지지 않습니다.</p>
<h3>제12조 (분쟁 해결)</h3><p>서비스 이용과 관련한 분쟁은 회사와 이용자가 성실히 협의해 해결하며, 협의가 되지 않으면 민사소송법에 따른 관할 법원에서 해결합니다. 소비자는 한국소비자원 등 분쟁조정기구에 조정을 신청할 수 있습니다.</p>
<h3>부칙</h3><p>이 약관은 시행일부터 적용됩니다.</p>`}function Ft(){return`<h1>개인정보처리방침</h1>
<p class="muted">시행일: 2026년 __월 __일</p>
<p>${i(D.name)}(이하 "회사")는 개인정보보호법에 따라 이용자의 개인정보를 보호하고, 관련 고충을 처리하기 위해 다음과 같이 개인정보처리방침을 둡니다.</p>
<h3>1. 수집하는 개인정보와 수집 방법</h3>
<ul><li>회원 가입: 이메일 주소 (소셜 로그인 시 해당 서비스가 제공하는 이메일, 고유 식별자)</li>
<li>서비스 이용: 학습 기록(배운 단어, 오답, 복습 일정, 시험 점수 기록), 접속 기록, 기기·브라우저 정보</li>
<li>결제: 결제대행사가 처리하며 회사는 주문번호, 결제 수단 종류, 승인 일시, 금액만 보관합니다. 카드번호는 회사가 저장하지 않습니다.</li></ul>
<h3>2. 이용 목적</h3><p>회원 식별과 로그인, 학습 기록 저장과 기기 간 동기화, 이용권 관리와 결제·환불 처리, 서비스 개선을 위한 이용 통계, 공지와 고객 문의 응대.</p>
<h3>3. 보유 및 이용 기간</h3><p>회원 탈퇴 시 즉시 삭제합니다. 다만 다음은 법령에 따라 보관합니다.</p>
<ul><li>계약·청약철회 기록, 대금 결제 및 재화 공급 기록: 5년 (전자상거래법)</li><li>소비자 불만·분쟁 처리 기록: 3년 (전자상거래법)</li><li>접속 기록: 3개월 (통신비밀보호법)</li></ul>
<h3>4. 제3자 제공과 처리 위탁</h3><p>회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 서비스 운영을 위해 다음 업체에 처리를 위탁합니다.</p>
<ul><li>Supabase, Inc. (미국): 회원 인증, 데이터 저장 (국외 이전: 데이터는 Supabase 프로젝트가 위치한 리전의 서버에 저장됩니다)</li><li>토스페이먼츠 주식회사: 결제 처리</li><li>GitHub, Inc. (미국): 웹 페이지 호스팅</li></ul>
<h3>5. 이용자의 권리</h3><p>이용자는 언제든 자신의 개인정보를 열람·정정·삭제하거나 처리 정지를 요구할 수 있습니다. 학습 기록은 설정 화면에서 내려받을 수 있고, 회원 탈퇴는 설정 화면에서 바로 할 수 있습니다. 그 밖의 요청은 ${i(X)}로 보내 주세요.</p>
<h3>6. 안전성 확보 조치</h3><p>비밀번호 없는 이메일 인증, 전송 구간 암호화(HTTPS), 데이터베이스 접근 권한 제한(본인 데이터만 접근 가능한 행 단위 보안), 결제 정보 비보관.</p>
<h3>7. 쿠키와 로컬 저장소</h3><p>로그인 유지와 오프라인 학습을 위해 브라우저 로컬 저장소를 사용합니다. 브라우저 설정에서 삭제할 수 있으나, 삭제하면 로그인이 풀리고 기기에 저장된 학습 기록이 사라질 수 있습니다(계정에 저장된 기록은 유지됩니다).</p>
<h3>8. 개인정보 보호책임자</h3><p>${i(D.owner)} · ${i(X)}</p>
<h3>9. 변경</h3><p>이 방침을 바꿀 때는 적용 7일 전부터 서비스 화면에 공지합니다.</p>`}function Gt(){return`<h1>환불규정</h1>
<p class="muted">이용약관 제7조의 세부 기준입니다.</p>
<h3>전액 환불</h3><p>결제일로부터 7일 이내이고, 유료 단어 학습을 시작하지 않은 경우 전액 환불합니다.</p>
<h3>일할 환불</h3><p>유료 단어 학습을 시작했거나 결제일로부터 7일이 지난 경우, 결제 금액에서 이용한 일수만큼을 빼고 환불합니다. 계산식: 결제 금액 × (남은 일수 ÷ 이용권 전체 일수). 100원 미만은 버립니다.</p>
<h3>환불이 어려운 경우</h3><p>이용권 기간이 모두 지난 경우, 약관 위반으로 이용이 제한된 경우.</p>
<h3>신청 방법</h3><p>가입한 이메일로 ${i(X)}에 "환불 요청"과 주문번호(설정 → 결제 내역에서 확인)를 보내 주세요. 영업일 기준 3일 이내에 결제 수단으로 환불하며, 카드사 사정에 따라 실제 반영까지 3~7일이 더 걸릴 수 있습니다.</p>
<h3>문의</h3><p>${i(X)}</p>`}const Ue='단어 목록: <a href="https://www.newgeneralservicelist.com/toeic-service-list" target="_blank" rel="noopener">TOEIC Service List</a> (Browne &amp; Culligan, <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.ko" target="_blank" rel="noopener">CC BY-SA 4.0</a>)에서 단어를 골라 뜻·예문·문제를 붙였어요.';function Xt(){if(g.freeOnly){const e=g.feedbackUrl?` · <a href="${i(g.feedbackUrl)}" target="_blank" rel="noopener">의견 보내기</a>`:"";return`<p class="sync credit">${Ue} 예문과 해설은 이 앱에서 직접 만든 문장이에요.</p>
<p class="sync credit">이 앱은 개인정보를 수집하지 않아요. 학습 기록은 이 브라우저에만 저장되고, 글꼴은 Google Fonts에서 불러와요.${e}</p>`}return`<p class="sync biz">${i(D.name)} · 대표 ${i(D.owner)} · 사업자등록번호 ${i(D.regNo)} · 통신판매업신고 ${i(D.mailOrderNo)}<br>${i(D.address)} · ${i(D.phone)} · ${i(X)}</p>
<p class="sync credit">${Ue} · 예문과 해설은 ${i(D.name)}의 저작물입니다. · <a href="#/terms">이용약관</a> · <a href="#/privacy">개인정보처리방침</a> · <a href="#/refund">환불규정</a></p>`}const z=()=>p("app"),pe=()=>(H.length||1569).toLocaleString("ko-KR");function Qt(){B("landing_view"),z().innerHTML=`
  <section class="sheet landing">
    <span class="eyebrow">TOEIC 단어 · 문장으로 외우기</span>
    <h1 class="display">단어가 아니라<br>문장이 외워져요</h1>
    <p class="lead">토익 빈출 단어${g.freeOnly?"":" "+pe()+"개"}를 실제 시험에 나오는 문장 속에서 배워요. 문장 배열, 빈칸 퀴즈, 해석 퀴즈로 바로 써 보고, 틀린 단어는 다음 날 자동으로 다시 나와요.</p>
    ${g.freeOnly?`<div class="row"><a class="btn primary big" href="#/home" id="start">바로 시작하기</a></div>
    <p class="muted" style="margin:0">지금은 무료 베타예요. 가입 없이 600점 필수 단어·표현 ${_.length}개를 배울 수 있어요. 학습 기록은 이 기기의 브라우저에만 저장돼요.</p>`:`<div class="row"><a class="btn primary big" href="#/home" id="start">무료로 시작하기</a><a class="btn big" href="#/login">로그인</a></div>
    <p class="muted" style="margin:0">가입 없이 무료 단어 ${_.length||230}개를 바로 배울 수 있어요. 로그인하면 기록이 계정에 저장돼요.</p>`}
  </section>
  <section class="sheet">
    <h2>이렇게 배워요</h2>
    <div class="feat"><b>1. 암기카드</b><span>단어와 뜻, 자주 쓰는 짝(collocation)을 먼저 봐요.</span></div>
    <div class="feat"><b>2. 문장 배열</b><span>흩어진 블록을 순서대로 놓아 문장을 완성해요. 어려움 모드에서는 파트5 함정 단어가 섞여요.</span></div>
    <div class="feat"><b>3. 빈칸·해석 퀴즈</b><span>파트5 형식의 4지선다로 확인해요. 틀리면 헷갈린 단어와 함께 단어장에 담겨요.</span></div>
    <div class="feat"><b>4. 간격 복습</b><span>맞힌 단어는 1·3·7·14·30·60일 뒤에, 틀린 단어는 다음 날 다시 나와요.</span></div>
  </section>
  ${g.freeOnly?"":`<section class="sheet">
    <h2>무료와 이용권</h2>
    <table class="cmp"><tr><th></th><th>무료</th><th>이용권</th></tr>
      <tr><td>단어·표현</td><td>${_.length||230}개</td><td>${pe()}개 전부</td></tr>
      <tr><td>하루 새 단어</td><td>10개</td><td>최대 50개</td></tr>
      <tr><td>목표 레벨</td><td>600점</td><td>600 · 750 · 900+</td></tr>
      <tr><td>단어장·기록장·간격 복습</td><td>O</td><td>O</td></tr>
      <tr><td>기기 간 동기화</td><td>로그인 시</td><td>로그인 시</td></tr></table>
    <a class="btn" href="#/plans">이용권 가격 보기</a>
  </section>`}`,p("start").onclick=()=>{try{localStorage.setItem(Ze,"1")}catch{}}}const L={stage:"email",email:"",demoCode:"",busy:!1};function W(){const e=v.backend;if(v.user){T("#/account");return}const t=g.providers.length?`<div class="or"><span>또는</span></div><div class="row">${g.providers.map(n=>`<button class="btn prov" data-p="${i(n)}">${{kakao:"카카오로 계속하기",google:"Google로 계속하기",apple:"Apple로 계속하기"}[n]||n+"로 계속하기"}</button>`).join("")}</div>`:"";z().innerHTML=`<section class="sheet auth">
    <h2>로그인</h2>
    <p class="muted" style="margin:0">이메일로 받은 6자리 코드를 넣으면 돼요. 비밀번호는 없어요. 처음이면 자동으로 가입돼요.</p>
    ${L.stage==="email"?`
      <label class="f">이메일<input type="email" id="email" autocomplete="email" inputmode="email" placeholder="you@example.com" value="${i(L.email)}"></label>
      <button class="btn primary big" id="send" ${L.busy?"disabled":""}>${L.busy?"보내는 중…":"코드 받기"}</button>
      ${t}`:`
      <p class="muted" style="margin:0"><b style="color:var(--ink)">${i(L.email)}</b>(으)로 코드를 보냈어요. 메일이 안 보이면 스팸함도 확인해 주세요.</p>
      ${L.demoCode?`<p class="notice">데모 모드예요. 코드 <b class="num">${i(L.demoCode)}</b>을 넣으세요.</p>`:""}
      <label class="f">인증 코드<input type="text" id="code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="6자리 숫자"></label>
      <button class="btn primary big" id="verify" ${L.busy?"disabled":""}>${L.busy?"확인 중…":"로그인"}</button>
      <div class="row" style="justify-content:space-between"><button class="link" id="back">이메일 다시 입력</button><button class="link" id="resend">코드 다시 보내기</button></div>`}
    <p class="muted" style="margin:0;font-size:12px">로그인하면 <a href="#/terms">이용약관</a>과 <a href="#/privacy">개인정보처리방침</a>에 동의한 것으로 봐요.</p>
  </section>`;const s=async()=>{const n=(p("email")?p("email").value:L.email).trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n)){y("이메일 주소를 확인해 주세요");return}L.email=n,L.busy=!0,W();try{const o=await e.sendCode(n);L.demoCode=o&&o.demoCode||"",L.stage="code",B("login_code_sent")}catch(o){y(o.message||"코드를 보내지 못했어요",2600)}L.busy=!1,W();const l=p("code");l&&l.focus()};if(L.stage==="email")p("send").onclick=s,p("email").onkeydown=n=>{n.key==="Enter"&&s()},document.querySelectorAll(".prov").forEach(n=>n.onclick=async()=>{try{await e.signInWithProvider(n.dataset.p)}catch(l){y(l.message,2600)}});else{const n=async()=>{const l=p("code").value.replace(/\D/g,"");if(l.length<6){y("코드 6자리를 넣어 주세요");return}L.busy=!0,W();try{const o=await e.verifyCode(L.email,l);v.user=o,L.stage="email",L.busy=!1,L.demoCode="",B("login"),y("로그인했어요");const c=v.returnTo||"#/home";v.returnTo="",T(c)}catch(o){L.busy=!1,W(),y(o.message||"로그인에 실패했어요",2600)}};p("verify").onclick=n,p("code").onkeydown=l=>{l.key==="Enter"&&n()},p("code").focus(),p("back").onclick=()=>{L.stage="email",W()},p("resend").onclick=s}}async function Zt(){const e=v.backend;B("plans_view"),z().innerHTML='<section class="sheet"><p class="muted" style="margin:0">요금제를 불러오는 중…</p></section>';let t=[];try{t=await e.getPlans()}catch(l){z().innerHTML=`<section class="sheet"><h2>요금제를 불러오지 못했어요</h2><p class="muted">${i(l.message||"")}</p><button class="btn" onclick="location.reload()">다시 시도</button></section>`;return}const s=v.ent,n=t.reduce((l,o)=>!l||o.price_krw/o.days<l.price_krw/l.days?o:l,null);z().innerHTML=`
  <section class="sheet">
    <span class="eyebrow">이용권</span>
    <h1 class="display">${pe()}개 단어를 모두 열어요</h1>
    <p class="lead">자동 결제가 아니에요. 기간이 끝나면 그냥 끝나고, 배운 기록과 단어장은 그대로 남아요.</p>
    ${s.active?`<p class="notice">이용권 사용 중 · <b>${i($e(s.ends_at))}</b>까지. 지금 결제하면 끝나는 날부터 이어져요.</p>`:F()?`<p class="notice">지금은 무료 단어 ${_.length}개만 열려 있고 ${F().toLocaleString("ko-KR")}개가 잠겨 있어요.</p>`:""}
    <div class="plans">${t.map(l=>`<button class="plan" data-id="${i(l.id)}">
      ${n&&l.id===n.id&&t.length>1?`<span class="plan-tag">하루 ${Math.round(l.price_krw/l.days)}원 · 가장 저렴</span>`:`<span class="plan-tag muted">하루 ${Math.round(l.price_krw/l.days)}원</span>`}
      <span class="plan-name">${i(l.name)}</span><span class="plan-price num">${et(l.price_krw)}</span><span class="plan-cta">${s.active?"연장하기":"시작하기"}</span></button>`).join("")}</div>
    <ul class="incl">
      <li>단어·구동사·숙어·복합명사 ${pe()}개 전부</li>
      <li>하루 새 단어 최대 50개, 목표 레벨 750점·900점+</li>
      <li>모든 기기에서 이어서 학습 (로그인 기준)</li>
    </ul>
    <p class="muted" style="margin:0;font-size:13px">결제는 토스페이먼츠를 통해 카드로 진행돼요. 결제 후 7일 이내에 유료 단어 학습을 시작하지 않았다면 전액 환불돼요. <a href="#/refund">환불규정</a></p>
  </section>
  <section class="sheet">
    <h2>자주 묻는 질문</h2>
    <details class="faq"><summary>무료로는 뭘 할 수 있나요?</summary><p>600점 단어 중심의 무료 단어 ${_.length||230}개를 하루 10개씩 배우고, 단어장·기록장·간격 복습을 모두 쓸 수 있어요.</p></details>
    <details class="faq"><summary>자동으로 결제되나요?</summary><p>아니요. 한 번 결제하면 기간만큼만 쓰고 끝나요. 연장하려면 직접 다시 결제해요.</p></details>
    <details class="faq"><summary>환불은 어떻게 하나요?</summary><p>결제 후 7일 이내에 유료 단어를 아직 배우지 않았다면 전액, 그 뒤에는 남은 기간만큼 일할 계산해 환불해요. ${i(g.supportEmail)}로 주문번호와 함께 보내 주세요.</p></details>
    <details class="faq"><summary>기간이 끝나면 기록은요?</summary><p>배운 단어, 단어장, 점수 기록은 그대로 남아요. 유료 단어는 다시 잠기지만 이미 배운 단어의 복습은 계속할 수 있어요.</p></details>
  </section>`,document.querySelectorAll(".plan").forEach(l=>l.onclick=()=>es(t.find(o=>o.id===l.dataset.id)))}async function es(e){const t=v.backend;if(!v.user){v.returnTo="#/plans",y("결제하려면 먼저 로그인해 주세요"),T("#/login");return}B("pay_start",{plan:e.id});let s;try{s=await t.createOrder(e.id)}catch(n){y(n.message||"주문을 만들지 못했어요",2600);return}if(t.mode==="local"){try{await t.demoPay(s),await te(),await we(),B("pay_done",{plan:e.id,demo:!0}),y("데모 결제 완료! 이용권이 열렸어요",2600),T("#/account")}catch(n){y(n.message,2600)}return}try{const{loadTossPayments:n}=await bt(async()=>{const{loadTossPayments:d}=await import("./index.esm-ByVaU6EI.js");return{loadTossPayments:d}},[]),o=(await n(g.tossClientKey)).payment({customerKey:v.user.id}),c=location.origin+tt+"pay.html";await o.requestPayment({method:"CARD",amount:{currency:"KRW",value:s.amount},orderId:s.order_id,orderName:s.order_name,successUrl:c,failUrl:c,customerEmail:v.user.email,card:{useEscrow:!1,flowMode:"DEFAULT",useCardPoint:!1,useAppCardOnly:!1}})}catch(n){if(n&&n.code==="USER_CANCEL"){y("결제를 취소했어요");return}y(n&&n.message||"결제창을 열지 못했어요",2800)}}let Q=0;async function ft(){const e=v.backend,t=v.user,s=v.ent,n=`<div class="xfer">
      <span class="eyebrow">기록 옮기기</span>
      <span class="muted">다른 기기나 예전 앱의 학습 기록을 옮길 때 써요. 로그인하면 자동으로 동기화되니 평소에는 쓸 일이 없어요.</span>
      <div class="row"><button class="btn" id="exportBtn">내 기록 복사</button><button class="btn" id="importBtn">붙여넣은 기록 불러오기</button></div>
      <textarea id="xferBox" rows="3" placeholder="복사한 기록을 여기에 붙여넣으세요"></textarea>
    </div>`;if(!t){z().innerHTML=`<section class="sheet">
      <h2>내 정보</h2>
      <p class="muted" style="margin:0">지금은 로그인하지 않은 상태예요. 학습 기록은 이 브라우저에만 저장돼요. 로그인하면 기록이 계정에 저장되고 다른 기기에서도 이어서 할 수 있어요.</p>
      <a class="btn primary big" href="#/login">이메일로 로그인</a>
      <a class="btn" href="#/plans">이용권 보기</a>
      ${n}
    </section>
    ${Ve()}`,Fe();return}z().innerHTML=`<section class="sheet">
    <h2>내 정보</h2>
    <div class="kv"><span>이메일</span><b>${i(t.email||"")}</b></div>
    <div class="kv"><span>이용권</span><b>${s.active?`사용 중 · ${i($e(s.ends_at))}까지`:"없음 (무료)"}</b></div>
    <div class="row"><a class="btn ${s.active?"":"primary"}" href="#/plans">${s.active?"이용권 연장":"이용권 구매"}</a><button class="btn" id="logout">로그아웃</button></div>
  </section>
  <section class="sheet" id="orders"><h2>결제 내역</h2><p class="muted" style="margin:0">불러오는 중…</p></section>
  <section class="sheet">${n}</section>
  <section class="sheet danger">
    <h2>회원 탈퇴</h2>
    <p class="muted" style="margin:0">계정과 학습 기록이 모두 삭제돼요. 남은 이용권은 <a href="#/refund">환불규정</a>에 따라 환불돼요. 결제 기록은 법령에 따라 5년간 보관돼요.</p>
    <button class="btn" id="del">${Q?"정말 탈퇴할까요? 한 번 더 누르면 삭제돼요":"회원 탈퇴"}</button>
  </section>
  ${Ve()}`,Fe(),p("logout").onclick=async()=>{await te(),await e.signOut(),v.user=null,Q=0,y("로그아웃했어요"),T("#/home")},p("del").onclick=async()=>{if(!Q){Q=1,ft();return}try{await e.deleteAccount(),v.user=null,Q=0,fe(ee()),y("탈퇴했어요. 그동안 고마웠어요",3e3),T("#/welcome")}catch(l){y(l.message||"탈퇴 처리에 실패했어요",2800)}};try{const l=await e.listOrders(),o=p("orders");if(!o)return;const c={paid:"결제 완료",pending:"진행 중",failed:"실패",canceled:"취소·환불"};o.innerHTML=`<h2>결제 내역</h2>${l.length?l.map(d=>`<div class="entry"><div class="entry-head"><b>${i(d.order_name)}</b><span class="badge ${d.status==="paid"?"grad":""}">${c[d.status]||i(d.status)}</span></div><div class="muted num">${et(d.amount)} · ${i($e(d.created_at))} · 주문번호 ${i(d.order_id)}</div></div>`).join(""):'<p class="muted" style="margin:0">아직 결제 내역이 없어요.</p>'}
      <p class="muted" style="margin:0;font-size:12px">환불이나 영수증 문의: ${i(g.supportEmail)}</p>`}catch{const o=p("orders");o&&(o.innerHTML='<h2>결제 내역</h2><p class="muted">불러오지 못했어요.</p>')}}function Ve(){return`<p class="muted" style="margin:0;font-size:13px;text-align:center"><a href="#/terms">이용약관</a> · <a href="#/privacy">개인정보처리방침</a> · <a href="#/refund">환불규정</a> · 문의 ${i(g.supportEmail)}</p>`}function Fe(){const e=p("xferBox");p("exportBtn").onclick=()=>{const t=JSON.stringify(r);e.value=t,e.select();try{navigator.clipboard.writeText(t).then(()=>y("기록을 복사했어요"),()=>y("아래 칸의 글자를 길게 눌러 복사하세요"))}catch{y("아래 칸의 글자를 길게 눌러 복사하세요")}},p("importBtn").onclick=()=>{let t;try{t=JSON.parse(e.value.trim())}catch{t=null}if(!t||typeof t!="object"||!t.learned){y("붙여넣은 기록을 읽지 못했어요. 복사한 글자 전체를 붙여넣어 주세요",2600);return}fe(t),te(),y("기록을 불러왔어요"),T("#/home")}}function ts(e){const t=e==="privacy"?Ft():e==="refund"?Gt():Vt();z().innerHTML=`<section class="sheet legal">${t}<p><a href="#/home" class="link">← 돌아가기</a></p></section>`,window.scrollTo(0,0)}function Re(e){const t=e&&e.message||String(e||"");z().innerHTML=`<section class="sheet">
    <h2>앱을 불러오지 못했어요</h2>
    <p class="muted" style="margin:0">인터넷 연결을 확인하고 다시 시도해 주세요. 계속 안 되면 ${i(g.supportEmail)}로 알려 주세요.</p>
    ${t?`<p class="muted num" style="margin:0;font-size:12px">${i(t)}</p>`:""}
    <button class="btn primary" onclick="location.reload()">다시 시도</button>
  </section>`}let Ge="";function ss(){const e=location.hash.replace(/^#\/?/,"").split("?")[0];if(e)return e;let t=!1;try{t=!!localStorage.getItem(Ze)}catch{}return!v.user&&!t&&xt()?"welcome":"home"}const ns=["plans","account","login","terms","privacy","refund"];function ie(){const e=ss();if(g.freeOnly&&ns.includes(e)){location.replace("#/home");return}e!==Ge&&(rt(),window.scrollTo(0,0)),Ge=e,document.querySelectorAll("nav.tabs a").forEach(s=>s.setAttribute("aria-current",String(s.dataset.view===e)));const t=p("acct");t&&(t.classList.toggle("on",!!v.user),t.setAttribute("aria-current",String(e==="account"||e==="login"))),document.body.classList.toggle("landing-page",e==="welcome");try{switch(e){case"book":return pt();case"scores":return Y();case"plans":return Zt();case"account":return ft();case"login":return W();case"terms":case"privacy":case"refund":return ts(e);case"welcome":return Qt();default:if(e!=="home"){location.replace("#/home");return}return S()}}catch(s){console.error(s),Re(s)}}function Xe(){const e=p("sync");if(e){if(g.freeOnly){e.textContent="학습 기록은 이 기기의 브라우저에만 저장돼요. 브라우저 데이터를 지우면 사라지니, 학습 설정의 '기록 백업'으로 가끔 저장해 두세요.";return}e.textContent=v.user?"학습 기록이 계정에 저장돼요. 다른 기기에서도 이어서 할 수 있어요.":"학습 기록은 이 브라우저에 저장돼요. 로그인하면 계정에 저장돼요."}}async function as(){if(g.freeOnly){const t=p("acct");t&&(t.hidden=!0)}p("foot").innerHTML='<p class="sync" id="sync"></p>'+Xt(),document.querySelectorAll("nav.tabs a").forEach(t=>t.onclick=s=>{s.preventDefault(),rt(),T("#/"+t.dataset.view)}),kt();const e=await vt();v.backend=e,wt(e),v.route=ie,v.user=await e.init(),await we(),v.user&&await Be().catch(t=>console.warn("merge failed",t)),e.onAuth(async t=>{v.user=t,t&&await Be().catch(()=>{}),await we().catch(()=>{}),Xe(),ie()}),Xe(),window.addEventListener("hashchange",ie),ie(),B("app_open",{entitled:v.entitled,signed_in:!!v.user}),p("wcount").textContent=g.freeOnly?"무료 베타 · "+H.length+"개":"데모",addEventListener("pagehide",()=>{te()}),document.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&te()}),"serviceWorker"in navigator&&navigator.serviceWorker.register(tt+"sw.js").catch(()=>{})}window.addEventListener("error",e=>{p("app").children.length||Re(e.error||e.message)});as().catch(e=>{console.error(e),Re(e)});
