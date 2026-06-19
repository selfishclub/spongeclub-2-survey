import { NextResponse } from "next/server";
import { SCRIPT_URL } from "@/lib/config";

// 어드민 데이터 조회 — 서버에서만 비밀번호를 검증하고 Apps Script를 호출한다.
// 비밀번호(ADMIN_KEY)는 서버 환경변수에만 존재 → 클라이언트 번들/소스에 노출되지 않음.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  const key = process.env.ADMIN_KEY;

  if (!key) {
    return NextResponse.json(
      { result: "error", message: "서버에 ADMIN_KEY가 설정되어 있지 않습니다." },
      { status: 500 },
    );
  }
  if (password !== key) {
    return NextResponse.json({ result: "unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${SCRIPT_URL}?key=${encodeURIComponent(key)}`, {
      cache: "no-store",
    });
    const text = await res.text();
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { result: "error", message: "백엔드(Apps Script) 응답을 불러오지 못했습니다." },
      { status: 502 },
    );
  }
}
