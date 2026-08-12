import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { matchProduct, DEDUCT_STATUSES } from '../../shared/productMatch.ts';

// 출고/배송완료 주문 중 아직 재고에 반영되지 않은 건을 찾아 일괄 차감한다.
// 엑셀 일괄 업로드·일괄 상태변경처럼 개별 이벤트가 발생하지 않는 경우를 보정한다.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dryRun === true;

    const svc = base44.asServiceRole.entities;
    const [products, aliases] = await Promise.all([
      svc.Product.list('-created_date', 500),
      svc.ProductAlias.list('-created_date', 500),
    ]);

    // 이미 반영된 주문 ID 수집
    const doneOrderIds = new Set();
    for (let page = 0; page < 20; page++) {
      const logs = await svc.InventoryLog.filter({ reason: 'sale_out' }, '-created_date', 500, page * 500);
      logs.forEach((l) => l.order_id && doneOrderIds.add(l.order_id));
      if (logs.length < 500) break;
    }

    // 대상 주문 수집
    const orders = [];
    for (const status of DEDUCT_STATUSES) {
      for (let page = 0; page < 20; page++) {
        const batch = await svc.Order.filter({ status }, '-created_date', 500, page * 500);
        orders.push(...batch);
        if (batch.length < 500) break;
      }
    }

    const pending = orders.filter((o) => !doneOrderIds.has(o.id));
    const unmatched = {};
    const perProduct = {};
    const logsToCreate = [];

    for (const order of pending) {
      const match = matchProduct(order, products, aliases);
      if (!match) {
        const key = order.product_name || '(상품명 없음)';
        unmatched[key] = (unmatched[key] || 0) + 1;
        continue;
      }
      const qty = (order.quantity || 1) * (match.unitsPerOrder || 1);
      const pid = match.product.id;
      if (!perProduct[pid]) perProduct[pid] = { product: match.product, qty: 0, orders: [] };
      perProduct[pid].qty += qty;
      perProduct[pid].orders.push({ order, qty });
    }

    const applied = [];
    for (const entry of Object.values(perProduct)) {
      const before = entry.product.stock_quantity || 0;
      const after = Math.max(0, before - entry.qty);
      applied.push({ product: entry.product.name, deducted: entry.qty, stock_before: before, stock_after: after });

      if (dryRun) continue;

      await svc.Product.update(entry.product.id, { stock_quantity: after });

      let running = before;
      entry.orders.forEach(({ order, qty }) => {
        running = Math.max(0, running - qty);
        logsToCreate.push({
          product_id: entry.product.id,
          product_name: entry.product.name,
          quantity_change: -qty,
          reason: 'sale_out',
          reason_detail: `주문 반영 (${order.order_number || order.id})`,
          handler: '시스템 자동',
          order_id: order.id,
          stock_after: running,
        });
      });
    }

    if (!dryRun && logsToCreate.length) {
      for (let i = 0; i < logsToCreate.length; i += 200) {
        await svc.InventoryLog.bulkCreate(logsToCreate.slice(i, i + 200));
      }
    }

    return Response.json({
      success: true,
      dryRun,
      pendingOrders: pending.length,
      appliedOrders: pending.length - Object.values(unmatched).reduce((a, b) => a + b, 0),
      applied,
      unmatched: Object.entries(unmatched).map(([name, count]) => ({ name, count })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}