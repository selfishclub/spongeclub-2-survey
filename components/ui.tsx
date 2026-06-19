// ── 설문/어드민 공용 UI 컴포넌트 (다크 테마 · 디자인 토큰) ──
import type { ReactNode } from "react";

/* 상단 고정 진행률 바 */
export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1.5 w-full bg-line">
        <div
          className="progress-fill h-full bg-pop"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-end px-4 py-1">
        <span className="text-[11px] font-semibold tracking-wide text-muted tabular-nums">
          {pct}%
        </span>
      </div>
    </div>
  );
}

/* 섹션 상단 "SECTION N" 회색 대문자 소형 라벨 + 이모지 제목 */
export function SectionLabel({
  n,
  emoji,
  title,
}: {
  n: number;
  emoji: string;
  title: string;
}) {
  return (
    <div className="mb-5">
      <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-muted">
        SECTION {n}
      </div>
      <h2 className="mt-1.5 text-2xl font-extrabold leading-snug">
        <span className="mr-1.5">{emoji}</span>
        {title}
      </h2>
    </div>
  );
}

/* 섹션 카드 래퍼 */
export function SectionCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(0,0,0,0.3)] sm:p-8">
      {children}
    </section>
  );
}

/* 안내/강조 박스 */
export function Box({
  variant = "plain",
  children,
}: {
  variant?: "plain" | "yellow" | "warn";
  children: ReactNode;
}) {
  const styles: Record<string, string> = {
    plain: "border-line bg-white/5",
    yellow: "border-pop bg-pop/15",
    warn: "border-pop bg-pop/20",
  };
  return (
    <div
      className={`rounded-xl border-2 ${styles[variant]} p-4 text-[15px] leading-relaxed`}
    >
      {children}
    </div>
  );
}

/* 문항 라벨 + 안내문 + 필수 표시 */
export function FieldLabel({
  label,
  hint,
  required,
  error,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: boolean;
}) {
  return (
    <div className="mb-2">
      <label
        className={`block text-[16px] font-bold leading-snug ${
          error ? "text-red-400" : ""
        }`}
      >
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {hint && (
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{hint}</p>
      )}
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border bg-surface px-4 py-3 text-[15.5px] outline-none transition placeholder:text-neutral-500 focus:border-ink focus:ring-2 focus:ring-pop/60";

/* 단문 입력 */
export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: boolean;
  inputMode?: "text" | "email" | "tel";
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${inputBase} ${error ? "border-red-500" : "border-line"}`}
    />
  );
}

/* 장문 입력 */
export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  error?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`${inputBase} resize-y leading-relaxed ${
        error ? "border-red-500" : "border-line"
      }`}
    />
  );
}

/* 단일선택 (라디오) */
export function RadioGroup({
  options,
  value,
  onChange,
  error,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            type="button"
            key={opt}
            onClick={() => onChange(opt)}
            className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-[15.5px] transition ${
              selected
                ? "border-pop bg-pop/15 font-semibold"
                : error
                ? "border-red-500/60 bg-surface hover:border-neutral-500"
                : "border-line bg-surface hover:border-neutral-500"
            }`}
          >
            <span
              className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 ${
                selected ? "border-pop" : "border-neutral-600"
              }`}
            >
              {selected && <span className="h-2.5 w-2.5 rounded-full bg-pop" />}
            </span>
            <span>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

/* 복수선택 (체크박스 그룹) */
export function CheckboxGroup({
  options,
  values,
  onToggle,
  error,
}: {
  options: string[];
  values: string[];
  onToggle: (v: string) => void;
  error?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.map((opt) => {
        const selected = values.includes(opt);
        return (
          <button
            type="button"
            key={opt}
            onClick={() => onToggle(opt)}
            className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-[15.5px] transition ${
              selected
                ? "border-pop bg-pop/15 font-semibold"
                : error
                ? "border-red-500/60 bg-surface hover:border-neutral-500"
                : "border-line bg-surface hover:border-neutral-500"
            }`}
          >
            <span
              className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 ${
                selected
                  ? "border-pop bg-pop text-black"
                  : "border-neutral-600"
              }`}
            >
              {selected && <span className="text-[12px] leading-none">✓</span>}
            </span>
            <span>{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

/* 필수 동의 체크 항목 */
export function ConsentCheck({
  checked,
  onChange,
  label,
  error,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  error?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-[15px] font-semibold transition ${
        checked
          ? "border-pop bg-pop/15"
          : error
          ? "border-red-500 bg-red-950/40"
          : "border-line bg-surface hover:border-neutral-500"
      }`}
    >
      <span
        className={`flex h-6 w-6 flex-none items-center justify-center rounded-md border-2 ${
          checked ? "border-pop bg-pop text-black" : "border-neutral-600"
        }`}
      >
        {checked && <span className="text-[14px] leading-none">✓</span>}
      </span>
      <span>{label}</span>
    </button>
  );
}
