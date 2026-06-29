import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data } = body;
    const orderId = event?.entity_id;

    if (!data || !data.product_name) {
      return Response.json({ skipped: true, reason: "no product_name" });
    }

    // 취소된 주문은 차감하지 않음
    if (data.status === "cancelled") {
      return Response.json({ skipped: true, reason: "cancelled order" });
    }

    const productName = data.product_name;
    const quantity = data.quantity || 1;

    // 이미 이 주문으로 차감 로그가 있으면 중복 차감 방지
    if (orderId) {
      const existing = await base44.asServiceRole.entities.InventoryLog.filter({
        order_id: orderId,
        reason: "sale_out",
      });
      if (existing.length > 0) {
        return Response.json({ skipped: true, reason: "already deducted for this order" });
      }
    }

    // 제품명으로 매칭
    const products = await base44.asServiceRole.entities.Product.filter({ name: productName });
    if (products.length === 0) {
      return Response.json({ skipped: true, reason: `Product not found: ${productName}` });
    }

    const product = products[0];
    const currentStock = product.stock_quantity || 0;
    const newStock = Math.max(0, currentStock - quantity);

    await base44.asServiceRole.entities.Product.update(product.id, {
      stock_quantity: newStock,
    });

    await base44.asServiceRole.entities.InventoryLog.create({
      product_id: product.id,
      product_name: product.name,
      quantity_change: -quantity,
      reason: "sale_out",
      reason_detail: `주문 접수 차감 (${data.order_number || orderId})`,
      handler: "시스템 자동",
      order_id: orderId,
      stock_after: newStock,
    });

    return Response.json({
      success: true,
      product: product.name,
      stock_before: currentStock,
      stock_after: newStock,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});