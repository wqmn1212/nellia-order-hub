import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, ChevronDown, ChevronUp } from "lucide-react";

const BACKEND_CODE = `// ============================================
// Builder+ 백엔드 함수 (Deno) - 5분마다 실행
// ============================================

import { base44 } from "base44-sdk";

// ────────────────────────────────────────────
// 쿠팡 주문 동기화
// ────────────────────────────────────────────
async function syncCoupang(config) {
  const now = new Date();
  const from = new Date(config.last_synced_at || Date.now() - 3600000);
  
  // HMAC-SHA256 서명 생성 (쿠팡 API 요구사항)
  const datetime = now.toISOString().replace(/[-:T]/g,"").slice(0,14);
  const path = \`/v2/providers/seller_api/apis/api/v1/vendor-items/orders?vendorId=\${config.vendor_id}&createdAtFrom=\${from.toISOString()}&createdAtTo=\${now.toISOString()}&status=ACCEPT\`;
  const message = \`\${datetime}GET\${path}\`;
  const signature = await hmacSha256(config.secret_key, message);
  const authHeader = \`CEA algorithm=HmacSHA256, access-key=\${config.access_key}, signed-date=\${datetime}, signature=\${signature}\`;
  
  const res = await fetch(\`https://api-gateway.coupang.com\${path}\`, {
    headers: { Authorization: authHeader }
  });
  const { data: orders } = await res.json();

  for (const o of orders || []) {
    const exists = await base44.entities.Order.filter({ order_number: o.orderId, channel: "coupang" });
    if (exists.length > 0) {
      await base44.entities.Order.update(exists[0].id, { status: mapCoupangStatus(o.status) });
    } else {
      await base44.entities.Order.create({
        order_number: String(o.orderId),
        channel: "coupang",
        order_date: o.orderedAt?.slice(0,10),
        customer_name: o.receiver?.name,
        customer_phone: o.receiver?.safeNumber || o.receiver?.mobile,
        customer_address: o.receiver?.addr1 + " " + o.receiver?.addr2,
        customer_zipcode: o.receiver?.postCode,
        product_name: o.orderItems?.[0]?.productName,
        product_option: o.orderItems?.[0]?.externalVendorSkuCode,
        quantity: o.orderItems?.[0]?.shippingCount,
        price: o.orderItems?.[0]?.salesPrice,
        delivery_memo: o.receiver?.message,
        status: mapCoupangStatus(o.status),
      });
    }
  }
}

function mapCoupangStatus(s) {
  const map = { ACCEPT: "new", INSTRUCT: "preparing", DEPARTURE: "shipped", DELIVERING: "shipped", DELIVERED: "delivered", CANCEL_DONE: "cancelled" };
  return map[s] || "new";
}

// ────────────────────────────────────────────
// 네이버 주문 동기화
// ────────────────────────────────────────────
async function syncNaver(config) {
  // 1. 액세스 토큰 발급
  const timestamp = Date.now().toString();
  const signature = await hmacSha256(config.secret_key, \`\${config.access_key}_\${timestamp}\`);
  const tokenRes = await fetch("https://api.commerce.naver.com/external/v1/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: config.access_key, timestamp, client_secret_sign: signature, grant_type: "client_credentials", type: "SELF" })
  });
  const { access_token } = await tokenRes.json();

  // 2. 주문 목록 조회
  const from = new Date(config.last_synced_at || Date.now() - 3600000).toISOString();
  const to = new Date().toISOString();
  const res = await fetch(\`https://api.commerce.naver.com/external/v1/pay-order/seller/orders/query-by-time?from=\${from}&to=\${to}&type=PAYED\`, {
    headers: { Authorization: \`Bearer \${access_token}\` }
  });
  const { data: orders } = await res.json();

  for (const o of orders || []) {
    const exists = await base44.entities.Order.filter({ order_number: o.orderId, channel: "naver" });
    if (exists.length > 0) {
      await base44.entities.Order.update(exists[0].id, { status: mapNaverStatus(o.productOrderStatus) });
    } else {
      await base44.entities.Order.create({
        order_number: String(o.orderId),
        channel: "naver",
        order_date: o.paymentDate?.slice(0,10),
        customer_name: o.shippingAddress?.name,
        customer_phone: o.shippingAddress?.tel1,
        customer_address: o.shippingAddress?.baseAddress + " " + o.shippingAddress?.detailedAddress,
        customer_zipcode: o.shippingAddress?.zipCode,
        product_name: o.productName,
        product_option: o.optionContent,
        quantity: o.quantity,
        price: o.totalPaymentAmount,
        delivery_memo: o.shippingMemo,
        status: mapNaverStatus(o.productOrderStatus),
      });
    }
  }
}

function mapNaverStatus(s) {
  const map = { PAYED: "new", DELIVERING: "shipped", DELIVERED: "delivered", CANCEL_DONE: "cancelled" };
  return map[s] || "new";
}

// ────────────────────────────────────────────
// 메인 실행
// ────────────────────────────────────────────
export default async function main() {
  const configs = await base44.entities.ApiConfig.filter({ is_active: true });
  for (const config of configs) {
    await base44.entities.ApiConfig.update(config.id, { sync_status: "syncing" });
    try {
      if (config.channel === "coupang") await syncCoupang(config);
      if (config.channel === "naver") await syncNaver(config);
      await base44.entities.ApiConfig.update(config.id, { sync_status: "success", last_synced_at: new Date().toISOString(), sync_error: null });
    } catch (err) {
      await base44.entities.ApiConfig.update(config.id, { sync_status: "error", sync_error: err.message });
    }
  }
}`;

export default function SyncGuideCard() {
  const [open, setOpen] = useState(false);

  return (
    <Card className="border border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600" />
            <CardTitle className="text-sm font-semibold text-amber-800">
              Builder+ 업그레이드 후 — 백엔드 함수 설정 방법
            </CardTitle>
          </div>
          <button onClick={() => setOpen(!open)} className="text-amber-600">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-amber-700">
          아래 코드를 Base44 백엔드 함수에 붙여넣고 <strong>5분마다 실행</strong>으로 설정하면 자동 동기화가 시작됩니다.
        </p>
      </CardHeader>
      {open && (
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">① Base44 대시보드 → 백엔드 함수 → 새 함수 생성</Badge>
              <Badge variant="outline" className="text-xs">② 아래 코드 붙여넣기</Badge>
              <Badge variant="outline" className="text-xs">③ 스케줄: */5 * * * * (5분마다)</Badge>
            </div>
            <pre className="bg-slate-900 text-slate-100 text-xs rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto leading-relaxed whitespace-pre-wrap">
              {BACKEND_CODE}
            </pre>
          </div>
        </CardContent>
      )}
    </Card>
  );
}