import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { event, data, old_data } = body;
    
    // Only process when status changes to "shipped"
    if (!data || data.status !== "shipped") {
      return Response.json({ skipped: true, reason: "not a shipped status change" });
    }
    if (old_data && old_data.status === "shipped") {
      return Response.json({ skipped: true, reason: "already shipped" });
    }

    const productName = data.product_name;
    const quantity = data.quantity || 1;
    const orderId = event?.entity_id;

    // Find matching product by name
    const products = await base44.asServiceRole.entities.Product.filter({ name: productName });
    
    if (products.length === 0) {
      return Response.json({ skipped: true, reason: `Product not found: ${productName}` });
    }

    const product = products[0];
    const currentStock = product.stock_quantity || 0;
    const newStock = Math.max(0, currentStock - quantity);

    // Update product stock
    await base44.asServiceRole.entities.Product.update(product.id, { 
      stock_quantity: newStock 
    });

    // Create inventory log
    await base44.asServiceRole.entities.InventoryLog.create({
      product_id: product.id,
      product_name: product.name,
      quantity_change: -quantity,
      reason: "sale_out",
      reason_detail: `주문 출고 (${data.order_number || orderId})`,
      handler: "시스템 자동",
      order_id: orderId,
      stock_after: newStock,
    });

    return Response.json({ 
      success: true, 
      product: product.name, 
      stock_before: currentStock, 
      stock_after: newStock 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});