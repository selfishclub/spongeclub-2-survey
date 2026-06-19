# 🧽 스폰지클럽 2기 — 사전 서베이

1기 사전 서베이의 디자인 시스템(Pretendard / Ink·Paper·Yellow / SECTION 라벨 / 진행률 바)을 계승한 2기 사전 서베이입니다. Next.js(App Router) + TypeScript + Tailwind CSS v4 정적 사이트로, Google 스프레드시트에 응답을 저장하고 `/admin`에서 통계를 봅니다.

## 🔗 상태 / 저장소

- **공개 배포: 현재 내려둠** (외부 비공개). 무료 Vercel 플랜은 프로덕션 도메인에 로그인/비밀번호 보호를 걸 수 없어, 공개되지 않도록 배포본을 제거한 상태입니다.
- **GitHub (비공개)**: https://github.com/selfishclub/spongeclub-2-survey
- **Vercel 팀**: `daniselfishclub-droids-projects`

### 배포(공개)할 준비가 되면

```bash
npx vercel --prod --yes --scope daniselfishclub-droids-projects
```

> 배포하면 `https://06survey.vercel.app` 류의 공개 URL이 다시 생깁니다. 외부에 보이면 안 되는 동안에는 배포하지 마세요(또는 Vercel Pro 플랜에서 Deployment Protection 사용).

## ✍️ 빠른 수정 가이드 (다른 사람용)

| 무엇을 바꾸나 | 어디를 고치나 |
| --- | --- |
| 문구·안내문·버튼 텍스트 | `app/page.tsx` (설문), `app/admin/page.tsx` (어드민) |
| 선택지·표(연령대/카테고리/일정 등) | `lib/survey.ts` |
| 시트 연동 URL·노션/카카오 링크·어드민 비번 | `lib/config.ts` |
| 스프레드시트 저장 로직 | `apps-script/Code.gs` (Apps Script에 붙여넣고 재배포) |

**재배포**: 수정 후 아래 한 줄이면 끝 (Vercel이 클라우드에서 빌드).

```bash
npx vercel --prod --yes --scope daniselfishclub-droids-projects
```

> GitHub 저장소(`selfishclub`)와 Vercel 팀(`daniselfishclub-droid`)이 서로 다른 계정이라 **push 자동 배포는 연결돼 있지 않습니다.** 위 CLI 명령으로 수동 배포하거나, Vercel 대시보드에서 Git 연결을 직접 추가하세요.

## 구성

| 경로 | 설명 |
| --- | --- |
| `/` | 설문 폼 (인트로 ~ SECTION 1~7, Q1~Q23 + 동의 3종, 제출/완료) |
| `/admin` | 운영진 통계 대시보드 (비밀번호는 환경변수 `ADMIN_KEY`) |
| `app/api/admin/route.ts` | 어드민 조회 서버 라우트 — 비밀번호를 **서버에서만** 검증 |
| `apps-script/Code.gs` | Google Apps Script 웹앱 백엔드 (응답 저장 + 어드민 조회) |
| `lib/config.ts` | **배포 시 수정**: `SCRIPT_URL`, 노션/카카오 링크 |
| `lib/survey.ts` | 문항·선택지·표 데이터 모델 (시트 컬럼 키와 1:1) |

## 로컬 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드 검증
```

## 1) Google 스프레드시트 + Apps Script 배포

1. 새 Google 스프레드시트 생성 → 시트 탭 이름을 **`응답`** 으로 변경 (헤더는 스크립트가 자동 생성).
2. **확장 프로그램 → Apps Script** → `apps-script/Code.gs` 내용 붙여넣기.
3. **배포 → 새 배포 → 유형: 웹 앱**
   - 실행: **나**
   - 액세스 권한: **모든 사용자**
4. 생성된 **`/exec` URL** 복사.
5. `lib/config.ts` 의 `SCRIPT_URL` 을 복사한 URL로 교체.

> 폼은 `mode: 'no-cors'` 로 POST 하므로 응답 본문은 읽지 못하지만 시트에는 정상 저장됩니다. 전송 후에는 무조건 완료 화면으로 전환됩니다.

## 2) 미정 링크 교체 (`lib/config.ts`)

```ts
export const LINKS = {
  memberPromise: "", // 멤버의 약속 전문(노션) — 들어오면 교체. 비어 있으면 "(링크 준비 중)" 표기
  terms: "",         // 이용약관 전문(노션)
  kakao: "",         // 셀피쉬클럽 카카오채널
};
```

URL을 넣으면 자동으로 클릭 가능한 링크로 바뀝니다.

## 3) 어드민 비밀번호 설정 (환경변수)

비밀번호는 소스/브라우저 번들에 노출되지 않도록 **서버 환경변수**로만 둡니다.

- **로컬**: `.env.local` 에 `ADMIN_KEY=원하는비밀번호` (`.env.example` 참고, `.env*` 는 git 제외)
- **Vercel**: 프로젝트 환경변수에 `ADMIN_KEY` 추가 (Production)
- **Apps Script**: `apps-script/Code.gs` 의 `ADMIN_KEY` 를 **같은 값**으로 설정

동작: `/admin` 에서 비밀번호 입력 → 서버 라우트 `app/api/admin/route.ts` 가 환경변수와 대조 후, 서버에서 Apps Script(`?key=…`)를 호출해 데이터를 받아옵니다. 비밀번호와 조회 키가 브라우저로 내려가지 않습니다.

- 탭 3개:
  - **📊 통계 대시보드** — 총 응답 수, 동의 완료율(3종 모두 강조), 카테고리·연령대 분포, 시간확보·오프라인 리스크 강조, 주차별 불참 집계, 부조장 지원자 리스트.
  - **🗂 응답 목록** — 닉네임/본명/카테고리 검색, 제출시각 정렬, 카드 펼침으로 Q1~Q23 전체 보기, CSV 다운로드.
  - **📝 주관식 모아보기** — 문항 선택 시 전체 응답자의 답변을 닉네임과 함께 나열.

## 4) Vercel 배포

```bash
npx vercel        # 프리뷰
npx vercel --prod # 프로덕션
```

또는 GitHub 저장소를 Vercel에 연결하면 푸시 시 자동 배포됩니다. 환경변수는 필요 없습니다(설정은 `lib/config.ts` 에 인라인).

## 시트 컬럼 ↔ 문항 매핑

`Code.gs` 의 `HEADERS`, `lib/survey.ts` 의 `SHEET_KEYS` 가 동일 순서로 일치해야 합니다. 복수선택(`불참일정`)은 배열로 전송되어 시트에는 `', '` 로 join 되어 저장됩니다. 동의 3종(`동의_멤버약속/이용약관/콘텐츠활용`)은 `Y`/`N` 로 저장됩니다.
