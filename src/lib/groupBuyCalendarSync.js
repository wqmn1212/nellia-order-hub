import { base44 } from "@/api/base44Client";

// 공동구매 마감일을 구글 캘린더에 동기화 (마감일 없으면 함수에서 스킵)
export async function syncGroupBuyToGoogle(groupBuyId) {
  try {
    await base44.functions.invoke("syncGroupBuyToGoogleCalendar", { action: "create", groupBuyId });
  } catch (e) {
    console.error("공동구매 캘린더 동기화 실패", e);
  }
}

// 공동구매 삭제 시 연동된 구글 이벤트 제거
export async function deleteGroupBuyFromGoogle(googleEventId) {
  if (!googleEventId) return;
  try {
    await base44.functions.invoke("syncGroupBuyToGoogleCalendar", { action: "delete", google_event_id: googleEventId });
  } catch (e) {
    console.error("공동구매 캘린더 삭제 실패", e);
  }
}