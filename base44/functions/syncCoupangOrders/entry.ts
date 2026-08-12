import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { buildCoupangAuth } from '../../shared/coupangAuth.ts';
import { COUPANG_STATUS_MAP, COUPANG_COURIER_MAP, mapStatus, mapCourier } from '../../shared/orderStatusMap.ts';
import { upsertOrders, updateApiConfig } from '../../shared/orderUpsert.ts';

const HOST = "https://api-gateway.coupang.com";
const ORDER_STATUSES = ["ACCEPT", "INSTRUCT", "DEPARTURE", "DELIVERING", "FINAL_DELIVERY"];

async function fetchSheets(vendorId, accessKey, secretKey, status, from, to) {
  const path = `/v2/providers/openapi/apis/api/v4/vendors/${vendorId}/ordersheets`;
  const query = `createdAtFrom=${from}&createdAtTo=${to}&status=${status}&maxPerPage=50`;
  const auth = await buildCoupangAuth("GET", path, query, accessKey, secretKey);
  const res = await fetch(`${HOST}${path}?${query}`, {
    headers: { "Authorization": auth, "Content-Type": "application/json;charset=UTF-8" },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`쿠팡 주문 API 오류 (${res.status}): ${text.slice(0, 300)}`);
  const json = JSON.parse(text || "{}");
  return json.data || [];
}

function toOrders(sheet) {
  const receiver = sheet.receiver || {};
  const created = (sheet.orderedAt || "").slice(0, 10);
  const status = mapStatus(COUPANG_STATUS_MAP, sheet.status);

  return (sheet.orderItems || []).map((item) => ({
    order_number: String(sheet.orderId),
    product_order_number: String(item.vendorItemPackageId ? `${sheet.orderId}-${item.vendorItemId}` : `${sheet.orderId}-${item.vendorItemId}`),
    channel: "coupang",
    order_date: created || undefined,
    customer_name: receiver.name || "미확인",
    customer_phone: receiver.safeNumber || receiver.receiverNumber || undefined,
    customer_address: [receiver.addr1, receiver.addr2].filter(Boolean).join(" ") || undefined,
    customer_zipcode: receiver.postCode || undefined,
    product_name: item.sellerProductName || item.vendorItemName || "미확인",
    product_option: item.sellerProductItemName || undefined,
    quantity: Number(item.shippingCount || 1),
    price: Number(item.orderPrice || 0),
    delivery_memo: sheet.parcelPrintMessage || undefined,
    status,
    courier: mapCourier(COUPANG_COURIER_MAP, sheet.deliveryCompanyName),
    tracking_number: sheet.invoiceNumber || undefined,
    shipped_at: sheet.inTransitDateTime || undefined,
  }));
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accessKey = Deno.env.get("COUPANG_AD_ACCESS_KEY");
    const secretKey = Deno.env.get("COUPANG_AD_SECRET_KEY");
    const vendorId = Deno.env.get("COUPANG_VENDOR_ID");
    if (!accessKey || !secretKey || !vendorId) {
      return Response.json({ error: "쿠팡 API 키가 설정되지 않았습니다" }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const body = await req.json().catch(() => ({}));
    const fmt = (d) => d.toISOString().slice(0, 19);
    const from = body.from || fmt(new Date(Date.now() - 86400000));
    const to = body.to || fmt(new Date());

    try {
      const orders = [];
      for (const status of ORDER_STATUSES) {
        const sheets = await fetchSheets(vendorId, accessKey, secretKey, status, from, to);
        sheets.forEach((s) => orders.push(...toOrders(s)));
      }

      const result = await upsertOrders(svc, orders);
      await updateApiConfig(svc, "coupang", {
        sync_status: "success", last_synced_at: new Date().toISOString(), sync_error: "",
      });

      return Response.json({ success: true, channel: "coupang", fetched: orders.length, ...result });
    } catch (err) {
      await updateApiConfig(svc, "coupang", { sync_status: "error", sync_error: err.message.slice(0, 300) });
      return Response.json({ error: err.message }, { status: 502 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}