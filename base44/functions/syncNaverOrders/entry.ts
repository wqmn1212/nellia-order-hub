import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import bcrypt from 'npm:bcryptjs@2.4.3';
import { NAVER_STATUS_MAP, NAVER_COURIER_MAP, mapStatus, mapCourier } from '../../shared/orderStatusMap.ts';
import { upsertOrders, updateApiConfig } from '../../shared/orderUpsert.ts';

const BASE = "https://api.commerce.naver.com/external";

// 커머스 API 인증: bcrypt(clientId_timestamp, clientSecret) → base64
async function getAccessToken(clientId, clientSecret) {
  const timestamp = Date.now();
  const hashed = bcrypt.hashSync(`${clientId}_${timestamp}`, clientSecret);
  const sign = btoa(hashed);

  const params = new URLSearchParams({
    client_id: clientId,
    timestamp: String(timestamp),
    client_secret_sign: sign,
    grant_type: "client_credentials",
    type: "SELF",
  });

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new Error(`네이버 커머스 토큰 발급 실패 (${res.status}): ${json.message || JSON.stringify(json).slice(0, 200)}`);
  }
  return json.access_token;
}

async function api(token, method, path, body) {
  const opts = {
    method,
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`네이버 커머스 API 오류 ${method} ${path} (${res.status}): ${json.message || JSON.stringify(json).slice(0, 200)}`);
  }
  return json;
}

function toOrder(item) {
  const po = item.productOrder || {};
  const ord = item.order || {};
  const ship = po.shippingAddress || {};
  const delivery = item.delivery || {};

  return {
    order_number: ord.orderId || po.orderId,
    product_order_number: po.productOrderId,
    channel: "naver",
    order_date: (ord.orderDate || po.orderDate || "").slice(0, 10) || undefined,
    customer_name: ship.name || po.shippingAddress?.name || ord.ordererName || "미확인",
    customer_phone: ship.tel1 || ship.tel2 || undefined,
    customer_address: [ship.baseAddress, ship.detailedAddress].filter(Boolean).join(" ") || undefined,
    customer_zipcode: ship.zipCode || undefined,
    product_name: po.productName || "미확인",
    product_option: po.productOption || undefined,
    quantity: Number(po.quantity || 1),
    price: Number(po.totalPaymentAmount || po.unitPrice || 0),
    delivery_memo: po.shippingMemo || undefined,
    status: mapStatus(NAVER_STATUS_MAP, po.productOrderStatus),
    courier: mapCourier(NAVER_COURIER_MAP, delivery.deliveryCompany),
    tracking_number: delivery.trackingNumber || undefined,
    shipped_at: delivery.deliveredDate || delivery.sendDate || undefined,
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = Deno.env.get("NAVER_COMMERCE_CLIENT_ID");
    const clientSecret = Deno.env.get("NAVER_COMMERCE_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      return Response.json({ error: "네이버 커머스 API 키가 설정되지 않았습니다" }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const body = await req.json().catch(() => ({}));

    try {
      const token = await getAccessToken(clientId, clientSecret);

      const from = body.from || new Date(Date.now() - 86400000).toISOString();
      const qs = new URLSearchParams({ lastChangedFrom: from });
      if (body.to) qs.set("lastChangedTo", body.to);

      const changed = await api(token, "GET", `/v1/pay-order/seller/product-orders/last-changed-statuses?${qs.toString()}`);
      const ids = [...new Set((changed.data?.lastChangeStatuses || []).map((s) => s.productOrderId).filter(Boolean))];

      if (ids.length === 0) {
        await updateApiConfig(svc, "naver", {
          sync_status: "success", last_synced_at: new Date().toISOString(), sync_error: "",
        });
        return Response.json({ success: true, channel: "naver", changed: 0, created: 0, updated: 0 });
      }

      const orders = [];
      for (let i = 0; i < ids.length; i += 100) {
        const detail = await api(token, "POST", "/v1/pay-order/seller/product-orders/query", {
          productOrderIds: ids.slice(i, i + 100),
        });
        (detail.data || []).forEach((item) => orders.push(toOrder(item)));
      }

      const result = await upsertOrders(svc, orders);
      await updateApiConfig(svc, "naver", {
        sync_status: "success", last_synced_at: new Date().toISOString(), sync_error: "",
      });

      return Response.json({ success: true, channel: "naver", changed: ids.length, ...result });
    } catch (err) {
      await updateApiConfig(svc, "naver", { sync_status: "error", sync_error: err.message.slice(0, 300) });
      return Response.json({ error: err.message }, { status: 502 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}