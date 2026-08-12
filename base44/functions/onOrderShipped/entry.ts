import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { matchProduct, DEDUCT_STATUSES } from '../../shared/productMatch.ts';

// 주문 상태가 출고/배송완료로 바뀌면 재고를 차감한다.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { event, data, old_data } = body;

    if (!data || !DEDUCT_STATUSES.includes(data.status)) {
      return Response.json({ skipped: true, reason: 'not a deductible status' });
    }
    if (old_data && DEDUCT_STATUSES.includes(old_data.status)) {
      return Response.json({ skipped: true, reason: 'already deducted status' });
    }
    if (!data.product_name) {
      return Response.json({ skipped: true, reason: 'no product_name' });
    }

    const svc = base44.asServiceRole.entities;
    const orderId = event?.entity_id;

    // 중복 차감 방지
    if (orderId) {
      const existing = await svc.InventoryLog.filter({ order_id: orderId, reason: 'sale_out' });
      if (existing.length > 0) {
        return Response.json({ skipped: true, reason: 'already deducted for this order' });
      }
    }

    const [products, aliases] = await Promise.all([
      svc.Product.list('-created_date', 500),
      svc.ProductAlias.list('-created_date', 500),
    ]);

    const match = matchProduct(data, products, aliases);
    if (!match) {
      return Response.json({ skipped: true, reason: `Product not matched: ${data.product_name}` });
    }

    const product = match.product;
    const quantity = (data.quantity || 1) * (match.unitsPerOrder || 1);
    const currentStock = product.stock_quantity || 0;
    const newStock = Math.max(0, currentStock - quantity);

    await svc.Product.update(product.id, { stock_quantity: newStock });
    await svc.InventoryLog.create({
      product_id: product.id,
      product_name: product.name,
      quantity_change: -quantity,
      reason: 'sale_out',
      reason_detail: `주문 출고 (${data.order_number || orderId})`,
      handler: '시스템 자동',
      order_id: orderId,
      stock_after: newStock,
    });

    return Response.json({
      success: true,
      product: product.name,
      matched_via: match.via,
      stock_before: currentStock,
      stock_after: newStock,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}