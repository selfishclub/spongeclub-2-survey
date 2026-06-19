// ── 스폰지클럽 2기 사전 서베이 설정 ──

// Google Apps Script 웹앱 /exec URL (4장 참고)
export const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyu8PDO69m8gVvExwPAWb_Yy8YADHHs-9uMJfMjffwRx5WX2S700I3tDdIygl4xo6g/exec";

// 어드민 비밀번호는 서버 환경변수 ADMIN_KEY로만 존재합니다.
// (app/api/admin/route.ts 에서 서버 측 검증 → 소스/번들에 노출되지 않음)

// 외부 링크 — 확정되는 대로 교체 (7장 미정 항목)
export const LINKS = {
  memberPromise:
    "https://sepia-quartz-81f.notion.site/3845c0a04646804895b9f28904682912", // 멤버의 약속 전문(노션)
  terms:
    "https://sepia-quartz-81f.notion.site/3845c0a04646801b8b05e4f7c27bb738", // 이용약관 전문(노션)
  kakao: "", // TODO: 셀피쉬클럽 카카오채널 링크
};
