import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// 읽기 전용: 제품별 InventoryLog 합계와 현재 재고를 대조해 불일치 목록 반환
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const svc = base44.asServiceRole.entities;

    const sums = {};
    const agg = await svc.InventoryLog.aggregate({ groupBy: 'product_id', sum: 'quantity_change', limit: 1000 });
    for (const r of agg.rows || []) sums[r.product_id] = r.sum_quantity_change || 0;

    const mismatches = [];
    let checked = 0;
    let cursor;
    do {
      const page = await svc.Product.filter({}, { limit: 500, cursor, fields: ['name', 'stock_quantity'] });
      for (const p of page.items) {
        checked++;
        const logSum = sums[p.id] || 0;
        const stock = p.stock_quantity || 0;
        if (logSum !== stock) mismatches.push({ product_id: p.id, name: p.name, stock_quantity: stock, log_sum: logSum, diff: stock - logSum });
      }
      cursor = page.has_more ? page.next_cursor : null;
    } while (cursor);

    return Response.json({ checked, mismatch_count: mismatches.length, mismatches });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}