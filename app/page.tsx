"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SCRIPT_URL, LINKS } from "@/lib/config";
import {
  type Answers,
  createEmptyAnswers,
  REQUIRED_KEYS,
  AGE_OPTIONS,
  CATEGORY_OPTIONS,
  TIME_COMMIT_OPTIONS,
  OFFLINE_OPTIONS,
  SUBLEADER_OPTIONS,
  ABSENCE_OPTIONS,
  ABSENCE_ALL_OK,
  TIME_TABLE,
  SCHEDULE_TABLE,
} from "@/lib/survey";
import {
  ProgressBar,
  SectionLabel,
  SectionCard,
  Box,
  FieldLabel,
  TextInput,
  TextArea,
  RadioGroup,
  CheckboxGroup,
  ConsentCheck,
} from "@/components/ui";

const ETC = "그 외(직접 입력)";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* 문항 단위 래퍼 */
function Field({
  id,
  label,
  hint,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  error?: boolean;
  children: ReactNode;
}) {
  return (
    <div id={id} className={`scroll-mt-24 ${error ? "field-error" : ""}`}>
      <FieldLabel label={label} hint={hint} required={required} error={error} />
      {children}
    </div>
  );
}

/* 동의 섹션의 노션 링크 (URL 미정이면 비활성 표기) */
function NotionLink({ href, label }: { href: string; label: string }) {
  if (!href) {
    return (
      <span className="inline-flex items-center gap-1 text-[14px] font-semibold text-muted">
        👉 {label}{" "}
        <span className="text-[12px] font-normal">(링크 준비 중)</span>
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[14px] font-semibold text-ink underline decoration-pop decoration-2 underline-offset-4 hover:opacity-70"
    >
      👉 {label}
    </a>
  );
}

export default function SurveyPage() {
  const [answers, setAnswers] = useState<Answers>(createEmptyAnswers);
  const [categorySel, setCategorySel] = useState("");
  const [categoryEtc, setCategoryEtc] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 카테고리(Q8): 단일선택 + 직접입력 → answers.카테고리 동기화
  const categoryValue = categorySel === ETC ? categoryEtc.trim() : categorySel;
  useEffect(() => {
    setAnswers((a) => ({ ...a, 카테고리: categoryValue }));
  }, [categoryValue]);

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) =>
    setAnswers((a) => ({ ...a, [key]: value }));

  // 불참일정(Q15): "전부 참여 가능"과 개별 항목은 상호배타
  const toggleAbsence = (opt: string) => {
    setAnswers((a) => {
      if (opt === ABSENCE_ALL_OK) {
        return {
          ...a,
          불참일정: a.불참일정.includes(ABSENCE_ALL_OK) ? [] : [ABSENCE_ALL_OK],
        };
      }
      const without = a.불참일정.filter((v) => v !== ABSENCE_ALL_OK);
      return {
        ...a,
        불참일정: without.includes(opt)
          ? without.filter((v) => v !== opt)
          : [...without, opt],
      };
    });
  };

  // 필수 항목 충족 여부
  const filled = (k: keyof Answers): boolean => {
    if (k === "불참일정") return answers.불참일정.length > 0;
    return String(answers[k] ?? "").trim() !== "";
  };

  // 에러 집합 계산
  const errors = useMemo(() => {
    const e = new Set<string>();
    for (const k of REQUIRED_KEYS) if (!filled(k)) e.add(k);
    if (answers.이메일.trim() && !EMAIL_RE.test(answers.이메일.trim()))
      e.add("이메일");
    if (!answers.동의_멤버약속) e.add("동의_멤버약속");
    if (!answers.동의_이용약관) e.add("동의_이용약관");
    if (!answers.동의_콘텐츠활용) e.add("동의_콘텐츠활용");
    return e;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  const err = (k: string) => showErrors && errors.has(k);

  // 진행률: 필수 항목 + 동의 3종 기준
  const progress = useMemo(() => {
    const total = REQUIRED_KEYS.length + 3;
    let done = REQUIRED_KEYS.filter(filled).length;
    if (answers.동의_멤버약속) done++;
    if (answers.동의_이용약관) done++;
    if (answers.동의_콘텐츠활용) done++;
    return (done / total) * 100;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  const handleSubmit = async () => {
    if (errors.size > 0) {
      setShowErrors(true);
      setTimeout(() => {
        document
          .querySelector(".field-error")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }
    setSubmitting(true);
    const payload = {
      ...answers,
      동의_멤버약속: answers.동의_멤버약속 ? "Y" : "N",
      동의_이용약관: answers.동의_이용약관 ? "Y" : "N",
      동의_콘텐츠활용: answers.동의_콘텐츠활용 ? "Y" : "N",
    };
    try {
      if (SCRIPT_URL.includes("XXXX")) {
        console.warn(
          "[스폰지클럽] SCRIPT_URL이 아직 교체되지 않았습니다. lib/config.ts를 확인하세요.",
        );
      }
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // 응답 본문은 못 읽지만 저장은 됨
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      // no-cors는 성공/실패 판별 불가 → 전송 후 무조건 완료 화면으로
      console.error(e);
    }
    setSubmitted(true);
    window.scrollTo({ top: 0 });
  };

  // ── 제출 완료 화면 ──
  if (submitted) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
        <div className="text-6xl">🧽</div>
        <h1 className="mt-6 text-3xl font-extrabold">제출 완료!</h1>
        <p className="mt-5 text-[16px] leading-relaxed text-neutral-300">
          신청서 제출이 완료되었습니다. 운영진이 답변을 검토한 뒤, 초대장과 사전
          안내를 발송해 드릴 예정입니다. 제출해 주신 내용을 바탕으로 조 배정이
          진행되니, 솔직한 답변에 감사드립니다.
        </p>
        <div className="mt-8 w-full">
          <Box variant="yellow">
            🧽 셀피쉬클럽 · 스폰지클럽 2기
            <br />
            문의:{" "}
            {LINKS.kakao ? (
              <a
                href={LINKS.kakao}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline underline-offset-4"
              >
                셀피쉬클럽 카카오채널
              </a>
            ) : (
              <span className="font-bold">셀피쉬클럽 카카오채널</span>
            )}
          </Box>
        </div>
      </main>
    );
  }

  // ── 설문 화면 ──
  return (
    <>
      <ProgressBar value={progress} />
      <main className="mx-auto max-w-2xl px-4 pb-32 pt-12 sm:px-6">
        {/* 인트로 */}
        <header className="mb-10">
          <div className="text-5xl">🧽</div>
          <h1 className="mt-4 text-[28px] font-extrabold leading-tight sm:text-4xl">
            스폰지클럽 2기
            <br />
            사전 서베이
          </h1>
          <div className="mt-6 space-y-4 text-[15.5px] leading-relaxed text-neutral-300">
            <p>스폰지클럽 2기에 함께해 주셔서 감사합니다.</p>
            <p>
              해당 서베이는 앞으로의 6주를 매끄럽게 운영하기 위한 사전
              서베이예요.
            </p>
            <p>
              스폰지클럽의 코어는{" "}
              <strong>&lsquo;이기적공유&rsquo;</strong>입니다. 한 주 동안 과제를
              하며 얻은 인사이트를 조별 모임을 통해서 서로 나누는 시간을 가지게
              됩니다. 시행착오와 인사이트를 나눌수록 인사이트가 쌓이고, 성장
              속도도 훨씬 빨라집니다. 많이 나눈 사람이 가장 많이 가져가는 구조를
              바탕으로, 스폰지클럽에서 6주를 함께 만들어가요.
            </p>
            <p className="font-medium">
              천천히 답해주세요. ⏱ 소요 시간: 약 20분
            </p>
          </div>
        </header>

        <div className="space-y-8">
          {/* ── SECTION 1 ── */}
          <SectionCard>
            <SectionLabel n={1} emoji="🙋" title="기본 정보 및 자기소개" />
            <div className="space-y-7">
              <Field
                id="본명"
                label="Q1. 본명 (실명)"
                hint="신청·결제하신 분과 동일한 이름으로 적어주세요."
                required
                error={err("본명")}
              >
                <TextInput
                  value={answers.본명}
                  onChange={(v) => set("본명", v)}
                  placeholder="홍길동"
                  error={err("본명")}
                />
              </Field>

              <Field
                id="닉네임"
                label="Q2. 닉네임 (선택)"
                hint="슬랙과 조 활동에서 사용하실 이름이에요. 따로 없으시면 안 쓰셔도 괜찮아요."
              >
                <TextInput
                  value={answers.닉네임}
                  onChange={(v) => set("닉네임", v)}
                  placeholder="스폰지 (선택)"
                />
              </Field>

              <Field
                id="이메일"
                label="Q3. 이메일"
                hint="운영 안내 수신용"
                required
                error={err("이메일")}
              >
                <TextInput
                  value={answers.이메일}
                  onChange={(v) => set("이메일", v)}
                  placeholder="you@example.com"
                  type="email"
                  inputMode="email"
                  error={err("이메일")}
                />
                {err("이메일") && answers.이메일.trim() && (
                  <p className="mt-1.5 text-[13px] text-red-400">
                    이메일 형식을 확인해주세요.
                  </p>
                )}
              </Field>

              <Field
                id="연락처"
                label="Q4. 연락처"
                hint="연락 가능한 휴대폰 번호"
                required
                error={err("연락처")}
              >
                <TextInput
                  value={answers.연락처}
                  onChange={(v) => set("연락처", v)}
                  placeholder="010-0000-0000"
                  type="tel"
                  inputMode="tel"
                  error={err("연락처")}
                />
              </Field>

              <Field
                id="연령대"
                label="Q5. 연령대"
                required
                error={err("연령대")}
              >
                <RadioGroup
                  options={AGE_OPTIONS}
                  value={answers.연령대}
                  onChange={(v) => set("연령대", v)}
                  error={err("연령대")}
                />
              </Field>

              <Field
                id="GitHub이메일"
                label="Q6. GitHub 계정 이메일"
                hint="셋업 데이와 W1 미니 세션부터 GitHub 계정이 필요합니다. 초대를 위해 깃헙 아이디가 아닌, 깃헙을 가입하신 이메일을 적어주세요."
                required
                error={err("GitHub이메일")}
              >
                <p className="mb-2 text-[13.5px] text-muted">
                  계정이 없으시면{" "}
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-ink underline decoration-pop decoration-2 underline-offset-4 hover:opacity-70"
                  >
                    github.com
                  </a>
                  에서 무료 가입 후 그 이메일을 적어주세요.
                </p>
                <TextInput
                  value={answers.GitHub이메일}
                  onChange={(v) => set("GitHub이메일", v)}
                  placeholder="github-email@example.com"
                  type="email"
                  inputMode="email"
                  error={err("GitHub이메일")}
                />
              </Field>

              <Field
                id="현재하는일"
                label="Q7. 현재 하고 계신 일"
                hint="한 줄로 소개해 주세요"
                required
                error={err("현재하는일")}
              >
                <TextInput
                  value={answers.현재하는일}
                  onChange={(v) => set("현재하는일", v)}
                  placeholder="예) 스타트업 마케터 / 1인 쇼핑몰 운영"
                  error={err("현재하는일")}
                />
              </Field>

              <Field
                id="카테고리"
                label="Q8. 본인을 가장 잘 설명하는 카테고리"
                required
                error={err("카테고리")}
              >
                <RadioGroup
                  options={[...CATEGORY_OPTIONS, ETC]}
                  value={categorySel}
                  onChange={setCategorySel}
                  error={err("카테고리")}
                />
                {categorySel === ETC && (
                  <div className="mt-2.5">
                    <TextInput
                      value={categoryEtc}
                      onChange={setCategoryEtc}
                      placeholder="직접 입력해주세요"
                      error={err("카테고리")}
                    />
                  </div>
                )}
              </Field>
            </div>
          </SectionCard>

          {/* ── SECTION 2 — 동의 ── */}
          <SectionCard>
            <SectionLabel
              n={2}
              emoji="✅"
              title="함께하기 전에 — 멤버의 약속 · 이용약관 · 콘텐츠 안내"
            />
            <p className="mb-6 text-[15px] leading-relaxed text-neutral-300">
              스폰지클럽은 운영진이 &lsquo;제공&rsquo;하는 강의가 아니라, 크루
              모두가 함께 굴리는 커뮤니티예요. 그래서 시작 전에 꼭 확인하고 가야
              할 세 가지를 안내드립니다. 가볍게 넘기지 마시고, 천천히 읽어보신 후
              체크해 주세요.
            </p>

            <div className="space-y-6">
              {/* 2-1. 멤버의 약속 · 이용약관 (통합 동의) */}
              <div
                id="동의_약관"
                className={`scroll-mt-24 ${
                  err("동의_멤버약속") || err("동의_이용약관")
                    ? "field-error"
                    : ""
                }`}
              >
                <h3 className="text-[16px] font-bold">
                  2-1. 멤버의 약속 · 이용약관
                </h3>

                <p className="mt-3 text-[14.5px] font-semibold">멤버의 약속</p>
                <p className="mt-1 text-[14.5px] leading-relaxed text-neutral-300">
                  이기적공유에 진심으로 참여하기, 조의 리듬을 함께 만들기, 서로의
                  시도를 존중하기 — 우리가 6주를 잘 보내기 위한 약속이에요.
                </p>
                <div className="mt-2">
                  <NotionLink
                    href={LINKS.memberPromise}
                    label="멤버의 약속 전문 보기 (노션)"
                  />
                </div>

                <p className="mt-4 text-[14.5px] font-semibold">이용약관</p>
                <p className="mt-1 text-[14.5px] leading-relaxed text-neutral-300">
                  참여·운영·환불 등에 대한 기본 약관이에요.
                </p>
                <div className="mt-2">
                  <NotionLink
                    href={LINKS.terms}
                    label="이용약관 전문 보기 (노션)"
                  />
                </div>

                <div className="mt-4">
                  <ConsentCheck
                    checked={answers.동의_멤버약속 && answers.동의_이용약관}
                    onChange={(v) =>
                      setAnswers((a) => ({
                        ...a,
                        동의_멤버약속: v,
                        동의_이용약관: v,
                      }))
                    }
                    label="이용약관을 모두 확인했으며, 스폰지클럽 멤버약속을 지킬 것에 동의합니다."
                    error={err("동의_멤버약속") || err("동의_이용약관")}
                  />
                </div>
              </div>

              {/* 2-2. 콘텐츠 활용 안내 */}
              <div
                id="동의_콘텐츠활용"
                className={`scroll-mt-24 ${
                  err("동의_콘텐츠활용") ? "field-error" : ""
                }`}
              >
                <h3 className="text-[16px] font-bold">
                  2-2. 콘텐츠 활용 안내 📸
                </h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-neutral-300">
                  스폰지클럽 활동 중 촬영되는 사진·영상, 그리고 슬랙·조 채널에
                  쌓이는 공유 기록은 스폰지클럽의 활동을 이기적으로 알리는
                  콘텐츠로 활용되거나 SNS 등에 올라갈 수 있어요.
                </p>
                <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-300">
                  원치 않으시면 <strong>사전에 미리, 또는 이후에라도 다니에게
                  말씀 주셔도 괜찮습니다.</strong> 말씀 주신 부분은 빠르게 확인해서
                  반영해 드립니다.
                </p>
                <div className="mt-3">
                  <ConsentCheck
                    checked={answers.동의_콘텐츠활용}
                    onChange={(v) => set("동의_콘텐츠활용", v)}
                    label="위 안내 내용을 확인했습니다."
                    error={err("동의_콘텐츠활용")}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── SECTION 3 — AI 도구 사용 경험 ── */}
          <SectionCard>
            <SectionLabel n={3} emoji="🤖" title="AI 도구 사용 경험" />
            <p className="mb-6 text-[15px] leading-relaxed text-neutral-300">
              조 배정과 W1 사전 안내에 활용하기 위해, 본인의 AI 사용 경험을
              솔직하게 적어주세요. 정답이 있는 질문이 아니에요. 잘 못 써도 괜찮고,
              많이 안 써도 괜찮아요.
            </p>
            <div className="space-y-7">
              <Field
                id="AI사용경험"
                label="Q9. 최근 AI 도구를 어떻게 사용하셨나요?"
                hint="최근 1~3개월 기준, 어떤 일에 어떻게 활용했는지 구체적으로."
                required
                error={err("AI사용경험")}
              >
                <TextArea
                  value={answers.AI사용경험}
                  onChange={(v) => set("AI사용경험", v)}
                  rows={5}
                  error={err("AI사용경험")}
                />
              </Field>
              <Field
                id="바이브코딩"
                label="Q10. 바이브 코딩(Vibe Coding) 사용 이력이 있으신가요?"
                hint="있다면 어떤 도구로 무엇을, 없다면 '없음'."
                required
                error={err("바이브코딩")}
              >
                <TextArea
                  value={answers.바이브코딩}
                  onChange={(v) => set("바이브코딩", v)}
                  rows={4}
                  error={err("바이브코딩")}
                />
              </Field>
              <Field
                id="Claude사용"
                label="Q11. 평소에 Claude를 사용하시나요?"
                hint="사용 빈도와 주 용도."
                required
                error={err("Claude사용")}
              >
                <TextArea
                  value={answers.Claude사용}
                  onChange={(v) => set("Claude사용", v)}
                  rows={4}
                  error={err("Claude사용")}
                />
              </Field>
              <Field
                id="막힌부분"
                label="Q12. AI를 쓰면서 본인이 가장 막히거나 어려웠던 부분은 무엇인가요?"
                required
                error={err("막힌부분")}
              >
                <TextArea
                  value={answers.막힌부분}
                  onChange={(v) => set("막힌부분", v)}
                  rows={4}
                  error={err("막힌부분")}
                />
              </Field>
            </div>
          </SectionCard>

          {/* ── SECTION 4 — 참여 조건과 시간 확보 ── */}
          <SectionCard>
            <SectionLabel n={4} emoji="⏳" title="참여 조건과 시간 확보" />
            <p className="mb-5 text-[15px] leading-relaxed text-neutral-300">
              스폰지클럽 2기를 제대로 굴리려면, 라이브 세션 외에도 본인 시간이
              필요합니다.
            </p>

            {/* 시간 구조 표 */}
            <div className="mb-6 overflow-hidden rounded-xl border border-line">
              <table className="w-full text-left text-[13.5px]">
                <thead className="bg-white/5 text-[12px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">구분</th>
                    <th className="px-3 py-2 font-semibold">시간</th>
                    <th className="px-3 py-2 font-semibold">내용</th>
                  </tr>
                </thead>
                <tbody>
                  {TIME_TABLE.map((r) => (
                    <tr key={r.구분} className="border-t border-line align-top">
                      <td className="px-3 py-2.5 font-bold whitespace-nowrap">
                        {r.구분}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{r.시간}</td>
                      <td className="px-3 py-2.5 text-neutral-300">{r.내용}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mb-6 text-[14.5px] leading-relaxed text-neutral-300">
              이 시간들은 6주 동안 전체적으로 확보되어야 합니다. 특정 한 주에
              몰아서가 아니라, 매주 본인의 리듬 안에서 꾸준히 굴러갈 수 있게요.
            </p>

            <div className="space-y-7">
              <Field
                id="시간확보"
                label="Q13. 위 시간 구조를 확인하셨고, 6주 동안 책임감 있게 확보하실 수 있겠습니까?"
                required
                error={err("시간확보")}
              >
                <RadioGroup
                  options={TIME_COMMIT_OPTIONS}
                  value={answers.시간확보}
                  onChange={(v) => set("시간확보", v)}
                  error={err("시간확보")}
                />
              </Field>
              <Field
                id="포기할것"
                label="Q14. 이 시간을 지키기 위해, 본인이 포기하거나 미뤄야 할 것 한 가지를 적어주세요."
                required
                error={err("포기할것")}
              >
                <TextInput
                  value={answers.포기할것}
                  onChange={(v) => set("포기할것", v)}
                  placeholder="예) 주말 넷플릭스 정주행"
                  error={err("포기할것")}
                />
              </Field>
            </div>

            {/* 환불 안내 */}
            <div className="mt-7">
              <Box variant="warn">
                <p className="font-bold">⚠️ 환불 안내</p>
                <p className="mt-2 leading-relaxed">
                  신청 후 본인의 일정·상황상 끝까지 함께 가기 어렵다고
                  판단되시면, <strong>6월 23일(화) 23:59까지</strong> 환불이
                  가능합니다. 이 시점이 지나면 조 편성과 운영 준비가 시작되기
                  때문에, 이후에는 환불·환급이 어렵다는 점 미리 양해
                  부탁드려요. 서로 함께하기로 한 약속을 가볍게 여기지 않기 위한
                  최소한의 기준이라고 생각해 주시면 감사하겠습니다.
                </p>
                <p className="mt-2 leading-relaxed">
                  모든 문의는 셀피쉬클럽 카카오채널로 부탁드립니다.
                </p>
              </Box>
            </div>
          </SectionCard>

          {/* ── SECTION 5 — 일정과 참여 방식 ── */}
          <SectionCard>
            <SectionLabel n={5} emoji="📅" title="일정과 참여 방식" />

            <div className="space-y-4">
              <Box variant="plain">
                <p className="font-bold">📹 카메라 사용 안내</p>
                <p className="mt-1.5 leading-relaxed text-neutral-300">
                  라이브 세션과 조 모임에서는 가급적 카메라를 켜고 참여해 주세요.
                  얼굴을 보고 이야기할 때 조의 리듬과 이기적공유의 밀도가 훨씬
                  좋아집니다.
                </p>
              </Box>

              <Box variant="yellow">
                <p className="font-bold">🛠 셋업 데이 안내 — 전원 참석</p>
                <p className="mt-1.5 leading-relaxed">
                  <strong>일시: 6월 27일(토) 저녁 8시 ~ 11시 (20:00–23:00)</strong>
                  <br />
                  <strong>방식: 온라인 진행</strong>
                </p>
                <p className="mt-2 leading-relaxed">
                  본격 시작 전, 함께 모여 GitHub와 Claude Code 환경을 직접
                  세팅하고 과제 제출 방법까지 익히는 시간입니다. 서로 가볍게
                  자기소개도 나눠요. 강의가 아니라 같이 손으로 세팅하는
                  자리예요. 이후 모든 주차가 매끄럽게 굴러가려면 꼭 필요한
                  시간이라, 전원 참석으로 진행합니다.
                </p>
              </Box>
            </div>

            {/* 6주 일정 표 */}
            <div className="mt-6 overflow-hidden rounded-xl border border-line">
              <table className="w-full text-left text-[13.5px]">
                <thead className="bg-white/5 text-[12px] uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">주차</th>
                    <th className="px-3 py-2 font-semibold">날짜</th>
                    <th className="px-3 py-2 font-semibold">시간</th>
                    <th className="px-3 py-2 font-semibold">형식</th>
                  </tr>
                </thead>
                <tbody>
                  {SCHEDULE_TABLE.map((r) => (
                    <tr
                      key={r.주차}
                      className={`border-t border-line align-top ${
                        r.highlight ? "bg-pop/15" : ""
                      }`}
                    >
                      <td className="px-3 py-2.5 font-bold whitespace-nowrap">
                        {r.주차}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{r.날짜}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{r.시간}</td>
                      <td className="px-3 py-2.5 text-neutral-300">{r.형식}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[13px] text-muted">
              커리큘럼은 진행 상황에 따라 일부 변경될 수 있습니다.
            </p>

            <div className="mt-7 space-y-7">
              <Field
                id="불참일정"
                label="Q15. 참여가 어렵거나 불확실한 일정을 모두 선택해주세요."
                required
                error={err("불참일정")}
              >
                <CheckboxGroup
                  options={[ABSENCE_ALL_OK, ...ABSENCE_OPTIONS]}
                  values={answers.불참일정}
                  onToggle={toggleAbsence}
                  error={err("불참일정")}
                />
              </Field>
              <Field
                id="불참사유"
                label="Q16. 위에서 체크하신 일정의 사유"
                hint="해당 없으면 비워두기"
              >
                <TextArea
                  value={answers.불참사유}
                  onChange={(v) => set("불참사유", v)}
                  rows={3}
                />
              </Field>
            </div>

            {/* W3 오프라인 안내 */}
            <div className="mt-7">
              <Box variant="yellow">
                <p className="font-bold">🏕 W3 오프라인 모임 — 7/12(일), 삼성</p>
                <p className="mt-1.5 leading-relaxed">
                  <strong>장소: 삼성 / 시간: 오후 2시 ~ 6시 (14:00–18:00)</strong>
                  <br />
                  6주 중 유일한 대면 모임이며, 이번 기수는 전체 크루가 다 함께
                  모입니다. (※ 세부 장소 등은 확정되는 대로 별도 공지드리며,
                  운영 상황에 따라 변동될 수 있어요.)
                </p>
              </Box>
            </div>

            <div className="mt-7 space-y-7">
              <Field
                id="오프라인참여"
                label="Q17. W3 오프라인 모임 참여 가능 여부"
                required
                error={err("오프라인참여")}
              >
                <RadioGroup
                  options={OFFLINE_OPTIONS}
                  value={answers.오프라인참여}
                  onChange={(v) => set("오프라인참여", v)}
                  error={err("오프라인참여")}
                />
              </Field>
              <Field
                id="지역"
                label="Q18. 거주·근무 지역"
                required
                error={err("지역")}
              >
                <TextInput
                  value={answers.지역}
                  onChange={(v) => set("지역", v)}
                  placeholder="예) 서울 강남구 / 경기 성남시"
                  error={err("지역")}
                />
              </Field>
            </div>
          </SectionCard>

          {/* ── SECTION 6 — 부조장 지원 ── */}
          <SectionCard>
            <SectionLabel
              n={6}
              emoji="🙌"
              title="부조장 지원 — 더 깊이 가져가고 싶다면"
            />
            <div className="space-y-3 text-[15px] leading-relaxed text-neutral-300">
              <p>
                스폰지클럽 2기는 총 6개 조 × 조당 12명 정도로 운영됩니다. 각
                조에는 조장과 함께, 조원들을 적극적으로 챙기고 활동하는 부조장이
                있어요.
              </p>
              <p>
                부조장은 누군가를 가르치는 자리가 아닙니다. 조장과 함께{" "}
                <strong>조원들을 적극적으로 챙기고, 본인의 인사이트를 가장 먼저
                나누며 공유해 주는 역할</strong>이에요. (조에 가장 먼저 발견을
                꺼내는 사람 / 조원들의 작업에 가장 먼저 반응하는 사람 / 조의
                리듬을 함께 만드는 사람.){" "}
                <strong>&lsquo;이기적공유&rsquo;</strong>에 가장 먼저 마음을 여는
                사람이고, 적극적으로 챙기고 공유할수록 본인에게도 더 큰 장점이
                되는 자리예요.
              </p>
            </div>
            <div className="mt-6 space-y-7">
              <Field
                id="부조장지원"
                label="Q19. 부조장으로 지원하실 의향이 있으신가요?"
                required
                error={err("부조장지원")}
              >
                <RadioGroup
                  options={SUBLEADER_OPTIONS}
                  value={answers.부조장지원}
                  onChange={(v) => set("부조장지원", v)}
                  error={err("부조장지원")}
                />
              </Field>
              <Field id="부조장이유" label="Q20. 부조장에 지원하신 이유">
                <TextInput
                  value={answers.부조장이유}
                  onChange={(v) => set("부조장이유", v)}
                  placeholder="(선택) 자유롭게 적어주세요"
                />
              </Field>
            </div>
          </SectionCard>

          {/* ── SECTION 7 — 마지막 ── */}
          <SectionCard>
            <SectionLabel n={7} emoji="✍️" title="마지막 — 본인의 언어로" />
            <p className="mb-5 text-[15px] leading-relaxed text-neutral-300">
              세 문항이 남았습니다. 본인의 언어로 적어주세요.
            </p>

            <div className="mb-6">
              <Box variant="plain">
                <p className="font-bold">💰 비용 안내</p>
                <p className="mt-1.5 leading-relaxed text-neutral-300">
                  6주 동안은 기본적으로 Claude를 사용하며, 필요에 따라 추가 API나
                  다른 툴이 더해질 수 있습니다. Claude 유료 계정 기준 사용 깊이에
                  따라 <strong>월 $100 ~ $200 수준</strong>의 비용이 발생할 수
                  있다는 점도 함께 인지하시고 답해주세요.
                </p>
              </Box>
            </div>

            <div className="space-y-7">
              <Field
                id="기억되고싶은모습"
                label="Q21. 6주 뒤, 스폰지클럽 크루들에게 어떤 사람으로 기억되고 싶으신가요?"
                required
                error={err("기억되고싶은모습")}
              >
                <TextArea
                  value={answers.기억되고싶은모습}
                  onChange={(v) => set("기억되고싶은모습", v)}
                  rows={4}
                  error={err("기억되고싶은모습")}
                />
              </Field>
              <Field
                id="집중영역"
                label="Q22. 이번 기간 동안 본인이 시간과 비용을 아낌없이 써보고 싶은 영역은 무엇인가요?"
                hint="아직 고민 중이라면 '고민 중'이라고 적으셔도 돼요."
                required
                error={err("집중영역")}
              >
                <TextArea
                  value={answers.집중영역}
                  onChange={(v) => set("집중영역", v)}
                  rows={4}
                  error={err("집중영역")}
                />
              </Field>
              <Field
                id="다짐"
                label="Q23. 마지막으로, 6주 동안 본인에게 하는 다짐과 이번 클럽에서 얻고자 하는 바를 적어주세요."
                required
                error={err("다짐")}
              >
                <TextArea
                  value={answers.다짐}
                  onChange={(v) => set("다짐", v)}
                  rows={5}
                  error={err("다짐")}
                />
              </Field>
            </div>
          </SectionCard>

          {/* ── 제출 영역 ── */}
          <div className="pt-2">
            {showErrors && errors.size > 0 && (
              <div className="mb-4 rounded-xl border-2 border-red-500/60 bg-red-950/40 px-4 py-3 text-[15px] font-semibold text-red-300">
                ⚠️ 작성하지 않은 필수 항목이 있어요.
              </div>
            )}
            <p className="mb-3 text-center text-[14px] text-muted">
              제출 후에는 답변을 수정할 수 없습니다.
            </p>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-2xl bg-pop py-4 text-[17px] font-extrabold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "제출 중…" : "제출하기 🧽"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
