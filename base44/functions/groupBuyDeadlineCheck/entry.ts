import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// 마감 하루 전인 공동구매를 찾아 관리자에게 알림 메일 발송 (하루 1회)
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const items = await svc.entities.GroupBuy.list('-created_date', 500);
    const targets = items.filter(
      (g) =>
        g.status !== 'completed' &&
        g.end_date &&
        String(g.end_date).split('T')[0] === tomorrowStr &&
        g.deadline_notified_at !== todayStr
    );

    if (targets.length === 0) return Response.json({ ok: true, notified: 0 });

    const listText = targets
      .map((g) => `• ${g.name}${g.partner_name ? ` (${g.partner_name})` : ''} — 마감: ${tomorrowStr}`)
      .join('\n');

    const users = await svc.entities.User.list();
    for (const admin of users.filter((u) => u.role === 'admin' && u.email)) {
      await svc.integrations.Core.SendEmail({
        to: admin.email,
        subject: `[Nellia OS] 내일 마감되는 공동구매 ${targets.length}건`,
        body: `내일(${tomorrowStr}) 마감 예정인 공동구매가 있습니다.\n\n${listText}\n\n마감 전 재고와 정산 조건을 확인해주세요.`,
      });
    }

    for (const g of targets) {
      await svc.entities.GroupBuy.update(g.id, { deadline_notified_at: todayStr });
    }

    return Response.json({ ok: true, notified: targets.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}