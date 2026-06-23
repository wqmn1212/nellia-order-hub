import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// 시간 문자열(HH:MM) 유효성 체크
function isValidTime(t) {
  return typeof t === 'string' && /^\d{2}:\d{2}$/.test(t);
}

// Task 데이터를 구글 캘린더 이벤트 본문으로 변환
function buildEventBody(task) {
  const date = task.due_date ? String(task.due_date).split('T')[0] : null;
  if (!date) return null; // 마감일 없으면 동기화 불가

  const assigneeLabel = {
    ceo: '대표', designer: '디자이너', marketer: '마케터', logistics: '물류/운영',
  }[task.assignee] || '';

  const base = assigneeLabel ? `[${assigneeLabel}] ${task.title}` : task.title;
  // 완료/취소 상태는 제목에 표시해 구글 캘린더에서도 한눈에 확인
  const prefix = task.status === 'done' ? '✅ ' : task.status === 'cancelled' ? '❌ ' : '';
  const summary = `${prefix}${base}`;
  const event = {
    summary,
    description: task.description || '',
  };

  // 시작/종료 시간이 있으면 시간 지정 이벤트, 없으면 종일 이벤트
  if (isValidTime(task.start_time)) {
    const end = isValidTime(task.end_time) ? task.end_time : task.start_time;
    event.start = { dateTime: `${date}T${task.start_time}:00`, timeZone: 'Asia/Seoul' };
    event.end = { dateTime: `${date}T${end}:00`, timeZone: 'Asia/Seoul' };
  } else {
    // 종일 이벤트는 end.date가 다음 날이어야 함
    const next = new Date(`${date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    const nextDate = next.toISOString().split('T')[0];
    event.start = { date };
    event.end = { date: nextDate };
  }
  return event;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { action, taskId, google_event_id } = payload;
    if (!action) {
      return Response.json({ error: 'action이 필요합니다.' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const baseUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

    // 삭제 처리: 호출 측에서 google_event_id를 함께 전달
    if (action === 'delete') {
      if (!google_event_id) return Response.json({ status: 'no_event' });
      const delRes = await fetch(`${baseUrl}/${google_event_id}`, { method: 'DELETE', headers: authHeader });
      if (!delRes.ok && delRes.status !== 410 && delRes.status !== 404) {
        return Response.json({ status: 'delete_failed', code: delRes.status }, { status: 200 });
      }
      return Response.json({ status: 'deleted' });
    }

    if (!taskId) {
      return Response.json({ error: 'taskId가 필요합니다.' }, { status: 400 });
    }

    // 생성/수정용 Task 로드
    const task = await base44.asServiceRole.entities.Task.get(taskId);
    if (!task) return Response.json({ error: 'Task를 찾을 수 없습니다.' }, { status: 404 });

    const body = buildEventBody(task);
    if (!body) {
      return Response.json({ status: 'skipped_no_date' });
    }

    // 기존 이벤트가 있으면 수정(PATCH), 없으면 생성(POST)
    if (task.google_event_id) {
      const patchRes = await fetch(`${baseUrl}/${task.google_event_id}`, {
        method: 'PATCH', headers: authHeader, body: JSON.stringify(body),
      });
      if (patchRes.ok) {
        return Response.json({ status: 'updated', google_event_id: task.google_event_id });
      }
      // 이벤트가 사라졌으면 새로 생성
      if (patchRes.status !== 404 && patchRes.status !== 410) {
        return Response.json({ status: 'update_failed', code: patchRes.status }, { status: 200 });
      }
    }

    const createRes = await fetch(baseUrl, {
      method: 'POST', headers: authHeader, body: JSON.stringify(body),
    });
    if (!createRes.ok) {
      const errText = await createRes.text();
      return Response.json({ status: 'create_failed', code: createRes.status, detail: errText }, { status: 200 });
    }
    const created = await createRes.json();
    // 생성된 이벤트 ID를 Task에 저장
    await base44.asServiceRole.entities.Task.update(taskId, { google_event_id: created.id });
    return Response.json({ status: 'created', google_event_id: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});