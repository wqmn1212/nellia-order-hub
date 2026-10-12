import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { makeDedupeKey } from '../../shared/dedupeKey.ts';

// 엑셀 업로드 주문 저장 (중복 차단 + 신규/갱신/동일 분류)
// dry_run=true면 분류만, dry_run=false면 실제 저장
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole.entities;

    const body = await req.json();
    const { orders, channel, dry_run } = body;
    if (!Array.isArray(orders) || orders.length === 0) {
      return Response.json({ error: 'orders is required' }, { status: 400 });
    }

    const batchId = dry_run ? null : `imp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // dedupe_key 계산
    const enriched = orders.map((o) => ({
      ...o,
      channel: o.channel || channel,
      dedupe_key: o.product_order_number || o.dedupe_key || makeDedupeKey({ ...o, channel: o.channel || channel }),
    }));

    // 기존 주문 한 번에 조회
    const keys = [...new Set(enriched.map((o) => o.dedupe_key))];
    const existing = [];
    for (let i = 0; i < keys.length; i += 100) {
      const chunk = keys.slice(i, i + 100);
      const page = await svc.Order.filter({ dedupe_key: { $in: chunk } }, { limit: 500 });
      existing.push(...page.items);
    }
    const existingMap = {};
    for (const e of existing) existingMap[e.dedupe_key] = e;

    const PROTECTED_FIELDS = ['status', 'tracking_number', 'shipped_at', 'courier'];

    let newCount = 0;
    const toCreate = [];
    const toUpdate = [];
    let identical = 0;

    for (const o of enriched) {
      const existingOrder = existingMap[o.dedupe_key];
      if (!existingOrder) {
        newCount++;
        if (!dry_run) toCreate.push({ ...o, status: 'new', import_batch_id: batchId });
        continue;
      }
      // 기존 주문과 비교 — 보호 필드 제외
      let hasDiff = false;
      const updateFields = {};
      for (const [k, v] of Object.entries(o)) {
        if (PROTECTED_FIELDS.includes(k) || k === 'dedupe_key' || k === 'import_batch_id') continue;
        if (v != null && v !== '' && String(v) !== String(existingOrder[k] ?? '')) {
          updateFields[k] = v;
          hasDiff = true;
        }
      }
      if (hasDiff) {
        toUpdate.push({ id: existingOrder.id, fields: updateFields });
      } else {
        identical++;
      }
    }

    if (!dry_run) {
      if (toCreate.length > 0) {
        await svc.Order.bulkCreate(toCreate);
      }
      for (const u of toUpdate) {
        await svc.Order.update(u.id, u.fields);
      }
    }

    return Response.json({
      dry_run: !!dry_run,
      batch_id: batchId,
      created: newCount,
      updated: toUpdate.length,
      identical,
      total: enriched.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}