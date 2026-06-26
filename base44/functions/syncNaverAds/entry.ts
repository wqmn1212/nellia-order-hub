import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BASE = "https://api.searchad.naver.com";

async function sign(timestamp, method, path, secretKey) {
  const message = `${timestamp}.${method}.${path}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
}

async function naverFetch(method, path, apiKey, secretKey, customerId, body) {
  const timestamp = Date.now().toString();
  const signature = await sign(timestamp, method, path, secretKey);
  const opts = {
    method,
    headers: {
      "X-Timestamp": timestamp,
      "X-API-KEY": apiKey,
      "X-Customer": customerId,
      "X-Signature": signature,
      "Content-Type": "application/json; charset=UTF-8",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { ok: res.ok, status: res.status, json };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get("NAVER_AD_API_KEY");
    const secretKey = Deno.env.get("NAVER_AD_SECRET_KEY");
    const customerId = Deno.env.get("NAVER_AD_CUSTOMER_ID");
    if (!apiKey || !secretKey || !customerId) {
      return Response.json({ error: "네이버 광고 API 키가 설정되지 않았습니다. NAVER_AD_API_KEY, NAVER_AD_SECRET_KEY, NAVER_AD_CUSTOMER_ID를 등록해주세요." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const reportDate = body.date || yesterday; // YYYY-MM-DD

    // 1) 마스터 리포트(AD) 생성 — 일자별 광고 성과
    const create = await naverFetch("POST", "/stat-reports", apiKey, secretKey, customerId, {
      reportTp: "AD",
      statDt: `${reportDate}T00:00:00.000Z`,
    });
    if (!create.ok) {
      return Response.json({ error: `네이버 리포트 생성 오류 (${create.status})`, detail: create.json }, { status: 502 });
    }
    const reportJobId = create.json.reportJobId;

    // 2) 완료 대기 (최대 ~20초)
    let downloadUrl = null;
    for (let i = 0; i < 10; i++) {
      await sleep(2000);
      const status = await naverFetch("GET", `/stat-reports/${reportJobId}`, apiKey, secretKey, customerId);
      if (status.ok && status.json.status === "BUILT") {
        downloadUrl = status.json.downloadUrl;
        break;
      }
      if (status.ok && status.json.status === "ERROR") {
        return Response.json({ error: "네이버 리포트 생성 실패", detail: status.json }, { status: 502 });
      }
    }
    if (!downloadUrl) {
      return Response.json({ error: "네이버 리포트 생성 시간 초과", reportJobId }, { status: 504 });
    }

    // 3) 다운로드 (TSV) — 다운로드 경로로 서명
    const dlPath = new URL(downloadUrl).pathname;
    const timestamp = Date.now().toString();
    const signature = await sign(timestamp, "GET", dlPath, secretKey);
    const dlRes = await fetch(downloadUrl, {
      headers: {
        "X-Timestamp": timestamp, "X-API-KEY": apiKey,
        "X-Customer": customerId, "X-Signature": signature,
      },
    });
    const tsv = await dlRes.text();

    // 4) TSV 파싱 후 집계 (AD 리포트: 컬럼 위치 기반)
    // 일반적 AD 리포트 컬럼: [date, customerId, campaignId, ..., impCnt, clkCnt, salesAmt(cost), ccnt(conv), convAmt]
    const agg = { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 };
    const lines = tsv.split("\n").filter((l) => l.trim());
    for (const line of lines) {
      const c = line.split("\t");
      // 뒤에서부터 안정적으로 읽기: convAmt, ccnt, salesAmt, clkCnt, impCnt
      const n = c.length;
      if (n < 6) continue;
      agg.revenue += Number(c[n - 1]) || 0;       // 전환매출액
      agg.conversions += Number(c[n - 2]) || 0;   // 전환수
      agg.spend += Number(c[n - 3]) || 0;         // 광고비
      agg.clicks += Number(c[n - 4]) || 0;        // 클릭수
      agg.impressions += Number(c[n - 5]) || 0;   // 노출수
    }

    const existing = await base44.asServiceRole.entities.AdPerformance.filter({ date: reportDate, platform: "naver" });
    const payload = {
      date: reportDate, platform: "naver",
      spend_krw: Math.round(agg.spend), impressions: Math.round(agg.impressions),
      clicks: Math.round(agg.clicks), conversions: Math.round(agg.conversions),
      conversion_value_krw: Math.round(agg.revenue),
    };
    if (existing.length > 0) await base44.asServiceRole.entities.AdPerformance.update(existing[0].id, payload);
    else await base44.asServiceRole.entities.AdPerformance.create(payload);

    return Response.json({ success: true, platform: "naver", date: reportDate, rows: lines.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});