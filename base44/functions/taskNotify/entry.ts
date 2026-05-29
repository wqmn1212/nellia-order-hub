import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data, old_data, changed_fields } = body;

    // 담당자 변경 감지
    if (event?.type === 'update' && changed_fields?.includes('assignee') && data?.assignee) {
      const assigneeNames = {
        ceo: '대표',
        designer: '디자이너',
        marketer: '마케터',
        logistics: '물류/운영',
      };

      const newAssigneeName = assigneeNames[data.assignee] || data.assignee;
      const oldAssigneeName = assigneeNames[old_data?.assignee] || old_data?.assignee || '미정';

      // 앱 관리자 목록 조회
      const users = await base44.asServiceRole.entities.User.list();
      const adminUsers = users.filter(u => u.role === 'admin');

      for (const admin of adminUsers) {
        if (!admin.email) continue;
        await base44.integrations.Core.SendEmail({
          to: admin.email,
          subject: `[Nellia OS] 업무 담당자 변경 알림`,
          body: `업무 담당자가 변경되었습니다.\n\n📌 업무: ${data.title}\n👤 변경 전: ${oldAssigneeName}\n👤 변경 후: ${newAssigneeName}\n📅 마감일: ${data.due_date || '미정'}\n\nNellia OS에서 확인하세요.`,
        });
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});