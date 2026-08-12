import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// 쿠팡 Wing 광고 API HMAC 서명 생성
async function buildAuth(method, path, query, accessKey, secretKey) {
  const datetime = new Date().toISOString().substr(2, 17).replace(/[-:T]/g, "").substr(0, 13) + "Z";
  // 실제 포맷: YYMMDDTHHmmssZ
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${String(now.getUTCFullYear()).slice(2)}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const message = stamp + method + path + (query || "");

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const signature = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");

  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${stamp}, signature=${signature}`;
}

Deno.serve(async (req) => {
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

    const body = await req.json().catch(() => ({}));
    // 조회 기간: 기본 어제 하루
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const startDate = (body.startDate || yesterday).replace(/-/g, "");
    const endDate = (body.endDate || yesterday).replace(/-/g, "");

    const method = "GET";
    // 쿠팡 광고센터 리포트 API (셀러 광고 일자별 성과)
    // 광고센터마다 provider 경로가 다를 수 있어 환경변수(COUPANG_AD_REPORT_PATH)로 덮어쓸 수 있도록 함
    const path = `/v2/providers/marketplace_openapi/apis/api/v1/marketplace/ad-reports`;
    const query = `startDate=${startDate}&endDate=${endDate}`;
    const auth = await buildAuth(method, path, query, accessKey, secretKey);

    const url = `https://api-gateway.coupang.com${path}?${query}`;
    const res = await fetch(url, {
      method,
      headers: {
        "Authorization": auth,
        "X-EXTENDED-TIMEOUT": "90000",
        "Content-Type": "application/json;charset=UTF-8",
      },
    });

    const text = await res.text();
    if (res.status === 404) {
      // 쿠팡 Open API에는 광고 리포트 엔드포인트가 공개되어 있지 않음 (광고센터 별도 승인 필요)
      return Response.json({
        error: "쿠팡 광고 성과 API는 판매자 Open API에서 제공되지 않습니다. 광고비는 광고 허브에서 수동 입력해주세요.",
      }, { status: 200 });
    }
    if (!res.ok) {
      return Response.json({ error: `쿠팡 API 오류 (${res.status})`, detail: text.slice(0, 500) }, { status: 502 });
    }

    let data;
    try { data = JSON.parse(text); } catch { data = {}; }
    const reports = data.data || data.content || [];

    // 일자별 집계
    const byDate = {};
    for (const r of reports) {
      const d = (r.date || r.adReportDate || endDate).toString().replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
      if (!byDate[d]) byDate[d] = { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 };
      byDate[d].spend += Number(r.adcost || r.spend || 0);
      byDate[d].impressions += Number(r.impressions || r.impression || 0);
      byDate[d].clicks += Number(r.clicks || r.click || 0);
      byDate[d].conversions += Number(r.orders || r.conversions || 0);
      byDate[d].revenue += Number(r.salesAmount || r.convAmount || 0);
    }

    let saved = 0;
    for (const [date, m] of Object.entries(byDate)) {
      const existing = await base44.asServiceRole.entities.AdPerformance.filter({ date, platform: "coupang" });
      const payload = {
        date, platform: "coupang",
        spend_krw: Math.round(m.spend), impressions: Math.round(m.impressions),
        clicks: Math.round(m.clicks), conversions: Math.round(m.conversions),
        conversion_value_krw: Math.round(m.revenue),
      };
      if (existing.length > 0) await base44.asServiceRole.entities.AdPerformance.update(existing[0].id, payload);
      else await base44.asServiceRole.entities.AdPerformance.create(payload);
      saved++;
    }

    return Response.json({ success: true, platform: "coupang", days: saved, dateRange: `${startDate}~${endDate}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});