import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date();
    const twoDaysLater = new Date(today);
    twoDaysLater.setDate(today.getDate() + 2);

    const todayStr = today.toISOString().split('T')[0];
    const twoDaysStr = twoDaysLater.toISOString().split('T')[0];

    const tasks = await base44.asServiceRole.entities.Task.list();
    const urgentTasks = tasks.filter(t => {
      if (!t.due_date || t.status === 'done' || t.status === 'cancelled') return false;
      const due = t.due_date.split('T')[0];
      return due >= todayStr && due <= twoDaysStr;
    });

    if (urgentTasks.length === 0) return Response.json({ ok: true, notified: 0 });

    const assigneeNames = {
      ceo: '대표', designer: '디자이너', marketer: '마케터', logistics: '물류/운영',
    };

    const taskListText = urgentTasks.map(t =>
      `• [${assigneeNames[t.assignee] || t.assignee}] ${t.title} (마감: ${t.due_date.split('T')[0]})`
    ).join('\n');

    const users = await base44.asServiceRole.entities.User.list();
    const adminUsers = users.filter(u => u.role === 'admin');

    for (const admin of adminUsers) {
      if (!admin.email) continue;
      await base44.integrations.Core.SendEmail({
        to: admin.email,
        subject: `[Nellia OS] 마감 임박 업무 ${urgentTasks.length}건`,
        body: `마감일이 2일 이내로 임박한 업무가 있습니다.\n\n${taskListText}\n\nNellia OS에서 확인하고 처리해주세요.`,
      });
    }

    return Response.json({ ok: true, notified: urgentTasks.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});