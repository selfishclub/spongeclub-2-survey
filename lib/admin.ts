// ── 어드민 데이터 페칭 ──
// 서버 라우트(/api/admin)에 비밀번호를 보내 검증·조회한다.
// 비밀번호는 서버에서만 다뤄지므로 클라이언트 번들에 노출되지 않는다.

// 시트 한 행 = 헤더(한글) → 값. 동의_*는 'Y'/'N', 불참일정은 ', ' join 문자열, timestamp는 ISO 문자열.
export type ResponseRow = Record<string, string>;

export async function fetchResponses(password: string): Promise<ResponseRow[]> {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (res.status === 401) throw new Error("UNAUTHORIZED");

  const data = await res.json().catch(() => ({ result: "error" }));
  if (data.result === "success") return data.rows as ResponseRow[];
  throw new Error(data.message || "데이터를 불러오지 못했습니다.");
}
