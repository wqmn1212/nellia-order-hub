import { base44 } from "@/api/base44Client";

// Task 생성/수정 시 구글 캘린더에 동기화 (마감일 없으면 스킵)
export async function syncTaskToGoogle(taskId) {
  try {
    await base44.functions.invoke("syncTaskToGoogleCalendar", { action: "create", taskId });
  } catch (e) {
    console.error("구글 캘린더 동기화 실패", e);
  }
}

// Task 삭제 시 연동된 구글 이벤트 제거
export async function deleteTaskFromGoogle(googleEventId) {
  if (!googleEventId) return;
  try {
    await base44.functions.invoke("syncTaskToGoogleCalendar", { action: "delete", google_event_id: googleEventId });
  } catch (e) {
    console.error("구글 캘린더 삭제 실패", e);
  }
}