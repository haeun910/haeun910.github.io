# 토익 문장 단어장 · 유료 서비스 버전

프로토타입(`/toeic/`)의 학습 로직은 그대로 두고, 계정·서버 저장·결제·콘텐츠 보호를 붙인 버전이에요.

| 구성 | 선택 | 이유 |
|---|---|---|
| 화면 | Vite + 바닐라 JS (`app/src`) | 기존 코드를 그대로 옮길 수 있고, 빌드 결과가 정적 파일이라 GitHub Pages에 그대로 올라가요 |
| 계정·DB | Supabase (Auth, Postgres, Edge Functions) | 무료 플랜으로 시작, 행 단위 보안(RLS)으로 유료 단어를 서버에서 막아요 |
| 결제 | 토스페이먼츠 결제위젯 SDK v2 | 국내 카드·간편결제, 개인사업자도 심사 후 사용 가능 |
| 호스팅 | GitHub Pages (지금과 동일) | 추가 비용 없음 |

## 폴더

```
app/
  src/            화면과 로직 (app.js 학습, views.js 로그인·요금제·내 정보, backend/ 서버 연결)
  supabase/       DB 스키마(migrations), 서버 함수(functions), CLI 설정
  scripts/        단어 데이터 업로드(seed-words), 데모 데이터 생성, 무료 범위 규칙(tiers)
  content/        단어 원본 words.json  ← git에 올리지 않음 (유료 콘텐츠)
  demo/           데모 빌드용 words.json ← git에 올리지 않음, scripts/make-demo-words.mjs 로 생성
  public/         manifest, 아이콘
```

## 무료와 이용권

- 무료: 600점 단어 중 230개 (원래 20개 + 단어 180개 + 구동사·숙어·복합명사 각 10개), 하루 새 단어 10개, 목표 레벨 600점까지.
- 이용권: 전체 1,569개, 하루 최대 50개, 목표 레벨 750·900점+. 30일 9,900원 / 90일 19,900원 (`plans` 테이블에서 바꿀 수 있어요).
- 유료 단어는 서버(RLS)가 막아요. 화면의 잠금 표시는 안내일 뿐, 데이터 자체가 내려오지 않아요.

## 처음 한 번 설정하기

### 1. Supabase 프로젝트

1. https://supabase.com 에서 프로젝트를 만들어요 (리전: Northeast Asia (Seoul) 추천).
2. SQL Editor에 `supabase/migrations/0001_init.sql` 내용을 붙여넣고 실행해요. (또는 CLI: `supabase link` 후 `supabase db push`)
3. Authentication → Providers → Email: 켜고, **Confirm email** 끄기, Email OTP 길이 6.
   Authentication → Email Templates → Magic Link 템플릿 본문에 `{{ .Token }}` 을 넣어야 6자리 코드가 메일로 가요. 예:
   `<p>로그인 코드: <b>{{ .Token }}</b> (5분 안에 입력)</p>`
4. Authentication → URL Configuration → Site URL: `https://haeun910.github.io/toeic/`, Redirect URLs에도 같은 주소 추가.
5. 카카오·구글 로그인을 쓰려면 Providers에서 켜고 각 개발자 콘솔에 Supabase가 알려주는 콜백 주소를 등록한 뒤, `.env`의 `VITE_AUTH_PROVIDERS=kakao,google`.
6. Project Settings → API에서 **Project URL**과 **anon public key**를 `.env`에 넣어요. **service_role key**는 절대 `.env`나 코드에 넣지 말고, 단어 업로드 때만 터미널 환경 변수로 써요.

### 2. 토스페이먼츠

1. https://developers.tosspayments.com 가입 → 내 개발 정보에서 **테스트 클라이언트 키**(`test_ck_…`)와 **테스트 시크릿 키**(`test_sk_…`)를 확인해요.
2. 실결제를 열려면 사업자등록번호·통신판매업 신고번호로 **전자결제 신청(계약)** 을 해요. 심사 뒤 라이브 키(`live_ck_…`, `live_sk_…`)가 나와요.
3. 웹훅: 개발자센터 → 웹훅에 `https://<프로젝트>.supabase.co/functions/v1/toss-webhook` 등록, 이벤트 `PAYMENT_STATUS_CHANGED`.

### 3. 서버 함수 올리기

```bash
npm i -g supabase            # 처음 한 번
supabase login
supabase link --project-ref <프로젝트 ref>
supabase secrets set TOSS_SECRET_KEY=test_sk_...      # 라이브 전환 시 live_sk_ 로 교체
supabase functions deploy confirm-payment
supabase functions deploy toss-webhook --no-verify-jwt
supabase functions deploy delete-account
```

### 4. 단어 데이터 올리기

```bash
cd app && npm install
SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=<service_role> npm run seed
```
단어를 고치거나 추가했을 때도 같은 명령으로 다시 올리면 돼요 (덮어쓰기). 그 뒤 `.env`의 `VITE_CONTENT_VERSION`을 1 올려서 브라우저 캐시를 갱신해요.

### 5. 빌드와 배포

```bash
cp .env.example .env     # 값 채우기 (사업자 정보 포함)
npm run build:prod       # ../toeic/ 에 결과물 생성 → 커밋·푸시하면 https://haeun910.github.io/toeic/
```
기존 프로토타입 사용자의 기록(`toeic-proto-v1`)은 첫 실행 때 자동으로 새 형식으로 옮겨져요.

데모(서버 없이 브라우저 안에서 로그인·결제 흉내): `npm run demo:words && npm run build:demo` → `../toeic-next/`. 데모 로그인 코드는 `123456`.

## 결제 흐름

1. 앱이 `create_order(plan)` RPC를 불러 주문을 만들어요 (가격은 서버의 `plans` 테이블 기준).
2. 토스 결제창(`requestPayment`)이 뜨고, 성공하면 `pay.html?paymentKey&orderId&amount`로 돌아와요.
3. `pay.html`이 `confirm-payment` 함수를 호출 → 함수가 주문 금액을 대조하고 토스 `/v1/payments/confirm`을 호출 → 성공 시 `grant_pass`로 이용권을 만들어요 (이미 이용권이 있으면 끝나는 날부터 이어 붙여요).
4. 사용자가 중간에 창을 닫아도 토스 웹훅(`toss-webhook`)이 같은 처리를 해 줘요. 취소·환불도 웹훅으로 반영돼요.

환불은 토스 개발자센터(또는 상점관리자)에서 결제를 취소하면 웹훅이 이용권을 닫아요. 일할 환불은 부분 취소로 처리해요.

## 출시 전 확인

- [ ] `.env`에 사업자 정보 6종 채우기 (화면 하단과 약관에 표시됨)
- [ ] `src/legal.js` 약관·개인정보처리방침·환불규정 검토 (시행일 채우기)
- [ ] 토스 테스트 키로 실제 결제창 → 승인 → 이용권 열림 확인, 그다음 라이브 키로 교체
- [ ] 소셜 로그인(선택) 콘솔 등록
- [ ] 프로토타입 `/toeic/`을 새 빌드로 교체, 데모 `/toeic-next/` 내리기
- [ ] Supabase 프로젝트 백업(Pro 플랜) 또는 주기적 `pg_dump`
