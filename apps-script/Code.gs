/**
 * 스폰지클럽 2기 사전 서베이 — Google Apps Script 웹앱 백엔드
 *
 * 배포 방법:
 *  1) 응답용 Google 스프레드시트 생성 → 시트 탭 이름을 '응답'으로
 *  2) 확장 프로그램 → Apps Script → 이 코드 붙여넣기
 *  3) 배포 → 새 배포 → 유형: 웹 앱
 *     - 실행: 나
 *     - 액세스: 모든 사용자
 *  4) 생성된 /exec URL 복사 → 프론트엔드 lib/config.ts 의 SCRIPT_URL 에 붙여넣기
 */

const SHEET_NAME = "응답";
// 어드민 조회 키 — Vercel 환경변수 ADMIN_KEY 와 동일한 값으로 직접 설정하세요.
const ADMIN_KEY = "여기에_운영진_비밀번호_입력";

const HEADERS = [
  "timestamp", "본명", "닉네임", "이메일", "연락처", "연령대", "GitHub이메일", "현재하는일", "카테고리",
  "동의_멤버약속", "동의_이용약관", "동의_콘텐츠활용",
  "AI사용경험", "바이브코딩", "Claude사용", "막힌부분",
  "시간확보", "포기할것", "불참일정", "불참사유", "오프라인참여", "지역",
  "부조장지원", "부조장이유",
  "기억되고싶은모습", "집중영역", "다짐",
];

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
    }
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    const data = JSON.parse(e.postData.contents);
    const row = HEADERS.map(function (h) {
      if (h === "timestamp") return new Date();
      const v = data[h];
      return Array.isArray(v) ? v.join(", ") : v == null ? "" : v;
    });
    sheet.appendRow(row);
    return ContentService.createTextOutput(
      JSON.stringify({ result: "success" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", message: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  const callback = p.callback; // JSONP fallback 지원

  function out(obj) {
    const json = JSON.stringify(obj);
    if (callback) {
      return ContentService.createTextOutput(
        callback + "(" + json + ")"
      ).setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(json).setMimeType(
      ContentService.MimeType.JSON
    );
  }

  if (p.key !== ADMIN_KEY) return out({ result: "unauthorized" });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2)
    return out({ result: "success", rows: [] });

  const values = sheet.getDataRange().getValues();
  const headers = values.shift();
  const rows = values.map(function (r) {
    const obj = {};
    headers.forEach(function (h, i) {
      obj[h] = r[i];
    });
    return obj;
  });
  return out({ result: "success", rows: rows });
}
