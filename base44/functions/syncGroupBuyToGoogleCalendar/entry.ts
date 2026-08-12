import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// 공동구매 마감일을 구글 캘린더 종일 이벤트로 등록/수정/삭제 (하루 전 알림 포함)
function buildEventBody(item) {
  const date = item.end_date ? String(item.end_date).split('T')[0] : null;
  if (!date) return null;

  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);

  const parts = [
    item.product_name ? `제품: ${item.product_name}` : '',
    item.partner_name ? `진행처: ${item.partner_name}` : '',
    item.start_date ? `기간: ${item.start_date} ~ ${date}` : '',
    item.notes || '',
  ].filter(Boolean);

  return {
    summary: `[공동구매 마감] ${item.name}`,
    description: parts.join('\n'),
    start: { date },
    end: { date: next.toISOString().split('T')[0] },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 1440 },
        { method: 'email', minutes: 1440 },
      ],
    },
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, groupBuyId, google_event_id } = await req.json();
    if (!action) return Response.json({ error: 'action이 필요합니다.' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const baseUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

    if (action === 'delete') {
      if (!google_event_id) return Response.json({ status: 'no_event' });
      const delRes = await fetch(`${baseUrl}/${google_event_id}`, { method: 'DELETE', headers: authHeader });
      if (!delRes.ok && delRes.status !== 404 && delRes.status !== 410) {
        return Response.json({ status: 'delete_failed', code: delRes.status });
      }
      return Response.json({ status: 'deleted' });
    }

    if (!groupBuyId) return Response.json({ error: 'groupBuyId가 필요합니다.' }, { status: 400 });

    const item = await base44.asServiceRole.entities.GroupBuy.get(groupBuyId);
    if (!item) return Response.json({ error: '공동구매를 찾을 수 없습니다.' }, { status: 404 });

    const body = buildEventBody(item);
    if (!body) return Response.json({ status: 'skipped_no_date' });

    if (item.google_event_id) {
      const patchRes = await fetch(`${baseUrl}/${item.google_event_id}`, {
        method: 'PATCH', headers: authHeader, body: JSON.stringify(body),
      });
      if (patchRes.ok) return Response.json({ status: 'updated', google_event_id: item.google_event_id });
      if (patchRes.status !== 404 && patchRes.status !== 410) {
        return Response.json({ status: 'update_failed', code: patchRes.status });
      }
    }

    const createRes = await fetch(baseUrl, { method: 'POST', headers: authHeader, body: JSON.stringify(body) });
    if (!createRes.ok) {
      return Response.json({ status: 'create_failed', code: createRes.status, detail: await createRes.text() });
    }
    const created = await createRes.json();
    await base44.asServiceRole.entities.GroupBuy.update(groupBuyId, { google_event_id: created.id });
    return Response.json({ status: 'created', google_event_id: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}