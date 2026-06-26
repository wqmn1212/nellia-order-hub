import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const results = {};

    // 쿠팡 동기화
    try {
      const coupang = await base44.functions.invoke("syncCoupangAds", {});
      results.coupang = coupang.data || coupang;
    } catch (e) {
      results.coupang = { error: e.message };
    }

    // 네이버 동기화
    try {
      const naver = await base44.functions.invoke("syncNaverAds", {});
      results.naver = naver.data || naver;
    } catch (e) {
      results.naver = { error: e.message };
    }

    return Response.json({ success: true, results, syncedAt: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});