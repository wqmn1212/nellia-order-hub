import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// 주문 상태가 cancelled 또는 returned로 바뀌면 출고 시 차감된 재고를 복구한다.
// 클레임 확정 시점에 복구한다 (창고 입고 확인과 무관).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data, old_data } = body;

    const RESTORE_STATUSES = ['cancelled', 'returned'];
    if (!data || !RESTORE_STATUSES.includes(data.status)) {
      return Response.json({ skipped: true, reason: 'not a restorable status' });
    }
    // 이미 cancelled/returned였으면 중복 복구 방지
    if (old_data && RESTORE_STATUSES.includes(old_data.status)) {
      return Response.json({ skipped: true, reason: 'already restored status' });
    }

    const svc = base44.asServiceRole.entities;
    const orderId = event?.entity_id;
    if (!orderId) {
      return Response.json({ skipped: true, reason: 'no order id' });
    }

    // 출고 시 차감 로그(sale_out)가 있는지 확인 — 없으면 미출고 주문이므로 복구 불필요
    const saleLogs = await svc.InventoryLog.filter({ order_id: orderId, reason: 'sale_out' });
    if (saleLogs.length === 0) {
      return Response.json({ skipped: true, reason: 'no sale_out log — order was not shipped' });
    }

    // 이미 복구한 이력이 있으면 멱등하게 스킵
    const restoreLogs = await svc.InventoryLog.filter({ order_id: orderId, reason: 'return_in' });
    if (restoreLogs.length > 0) {
      return Response.json({ skipped: true, reason: 'already restored for this order' });
    }

    const saleLog = saleLogs[0];
    const productId = saleLog.product_id;
    const restoreQty = Math.abs(saleLog.quantity_change || 0);

    const product = await svc.Product.get(productId);
    const currentStock = product.stock_quantity || 0;
    const newStock = currentStock + restoreQty;

    await svc.Product.update(productId, { stock_quantity: newStock });
    await svc.InventoryLog.create({
      product_id: productId,
      product_name: saleLog.product_name || product.name,
      quantity_change: restoreQty,
      reason: 'return_in',
      reason_detail: `반품/취소 재고 복구 (상태: ${data.status}, 주문: ${data.order_number || orderId})`,
      handler: '시스템 자동',
      order_id: orderId,
      stock_after: newStock,
    });

    return Response.json({
      success: true,
      product: saleLog.product_name || product.name,
      restored_quantity: restoreQty,
      stock_before: currentStock,
      stock_after: newStock,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}